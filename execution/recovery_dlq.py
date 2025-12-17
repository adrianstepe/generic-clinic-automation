#!/usr/bin/env python3
"""
Dead Letter Queue Recovery Script

Purpose: Recovers failed bookings from the DLQ directory and inserts them into Supabase.

Usage:
    python3 recovery_dlq.py                    # Process all pending files
    python3 recovery_dlq.py --dry-run          # Preview without modifying
    python3 recovery_dlq.py --file <path>      # Process specific file

Environment Variables Required:
    SUPABASE_URL - Supabase project URL
    SUPABASE_SERVICE_KEY - Service role key (bypasses RLS)
"""

import os
import json
import glob
import shutil
import argparse
from datetime import datetime
from pathlib import Path

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️  Warning: supabase-py not installed. Install with: pip install supabase")

# Configuration
DLQ_DIR = os.getenv("DLQ_DIR", "/home/n8n/dlq")
PROCESSED_DIR = os.path.join(DLQ_DIR, "processed")
MAX_RETRY_ATTEMPTS = 3

# Supabase fields to insert (must match table schema)
BOOKING_FIELDS = [
    "customer_name",
    "customer_email", 
    "customer_phone",
    "service_id",
    "service_name",
    "start_time",
    "end_time",
    "status",
    "amount_paid",
    "stripe_session_id",
    "payment_intent_id",
    "amount_cents",
    "currency",
    "client_reference"
]


def load_env():
    """Load environment variables from .env file if present."""
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip().strip('"\''))


def get_supabase_client() -> "Client":
    """Initialize Supabase client with service role key."""
    if not SUPABASE_AVAILABLE:
        raise RuntimeError("supabase-py is not installed")
    
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError(
            "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY"
        )
    
    return create_client(url, key)


def get_pending_files() -> list:
    """Get list of unprocessed DLQ files."""
    pattern = os.path.join(DLQ_DIR, "failed-*.json")
    return sorted(glob.glob(pattern))


def parse_dlq_file(filepath: str) -> dict:
    """Parse a DLQ JSON file."""
    with open(filepath, "r") as f:
        return json.load(f)


def extract_booking_data(dlq_data: dict) -> dict:
    """Extract booking fields from DLQ data."""
    booking = dlq_data.get("booking_data", {})
    
    # If booking_data is empty, try to reconstruct from original_input
    if not booking:
        original = dlq_data.get("original_input", {})
        metadata = original.get("data", {}).get("object", {}).get("metadata", {})
        customer = original.get("data", {}).get("object", {}).get("customer_details", {})
        
        booking = {
            "customer_name": customer.get("name") or metadata.get("customer_name"),
            "customer_email": customer.get("email") or metadata.get("customer_email"),
            "customer_phone": customer.get("phone") or metadata.get("customer_phone"),
            "service_id": metadata.get("service_id"),
            "service_name": metadata.get("serviceName"),
            "status": "confirmed",
        }
        
        # Reconstruct timestamps
        if metadata.get("booking_date") and metadata.get("booking_time"):
            start = f"{metadata['booking_date']}T{metadata['booking_time']}:00Z"
            booking["start_time"] = start
            # Add 1 hour for end time
            from datetime import datetime, timedelta
            start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
            end_dt = start_dt + timedelta(hours=1)
            booking["end_time"] = end_dt.isoformat().replace("+00:00", "Z")
    
    # Filter to only known fields and remove None values
    return {k: v for k, v in booking.items() if k in BOOKING_FIELDS and v is not None}


def insert_booking(client: "Client", booking: dict) -> dict:
    """Insert booking into Supabase."""
    response = client.table("bookings").insert(booking).execute()
    return response.data[0] if response.data else None


def mark_processed(filepath: str, success: bool = True):
    """Move file to processed directory or increment retry count."""
    if success:
        os.makedirs(PROCESSED_DIR, exist_ok=True)
        dest = os.path.join(PROCESSED_DIR, os.path.basename(filepath))
        shutil.move(filepath, dest)
        print(f"  ✅ Moved to: {dest}")
    else:
        # Increment retry counter in file
        with open(filepath, "r") as f:
            data = json.load(f)
        data["recovery_attempts"] = data.get("recovery_attempts", 0) + 1
        data["last_recovery_attempt"] = datetime.now().isoformat()
        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)
        print(f"  ⚠️  Retry count: {data['recovery_attempts']}")


def process_file(client: "Client", filepath: str, dry_run: bool = False) -> bool:
    """Process a single DLQ file."""
    filename = os.path.basename(filepath)
    print(f"\n📄 Processing: {filename}")
    
    try:
        dlq_data = parse_dlq_file(filepath)
        booking = extract_booking_data(dlq_data)
        
        if not booking.get("customer_email"):
            print("  ❌ Error: Missing customer_email, cannot recover")
            return False
        
        # Check if already exists (idempotency via stripe_session_id)
        if booking.get("stripe_session_id"):
            existing = client.table("bookings").select("id").eq(
                "stripe_session_id", booking["stripe_session_id"]
            ).execute()
            if existing.data:
                print(f"  ⏭️  Already exists in DB (stripe_session_id: {booking['stripe_session_id']})")
                mark_processed(filepath, success=True)
                return True
        
        print(f"  📧 Customer: {booking.get('customer_email')}")
        print(f"  🦷 Service: {booking.get('service_name')}")
        print(f"  📅 Time: {booking.get('start_time')}")
        
        if dry_run:
            print("  🔍 DRY RUN - Would insert above booking")
            return True
        
        result = insert_booking(client, booking)
        if result:
            print(f"  ✅ Inserted! ID: {result.get('id')}")
            mark_processed(filepath, success=True)
            return True
        else:
            print("  ❌ Insert returned no data")
            mark_processed(filepath, success=False)
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        if not dry_run:
            mark_processed(filepath, success=False)
        return False


def main():
    parser = argparse.ArgumentParser(description="Recover failed bookings from DLQ")
    parser.add_argument("--dry-run", action="store_true", help="Preview without changes")
    parser.add_argument("--file", help="Process specific file instead of all")
    args = parser.parse_args()
    
    load_env()
    
    print("=" * 60)
    print("🔄 DLQ Recovery Script")
    print(f"📁 DLQ Directory: {DLQ_DIR}")
    print(f"🔍 Dry Run: {args.dry_run}")
    print("=" * 60)
    
    if args.file:
        files = [args.file] if os.path.exists(args.file) else []
    else:
        files = get_pending_files()
    
    if not files:
        print("\n✨ No pending DLQ files found!")
        return
    
    print(f"\n📋 Found {len(files)} file(s) to process")
    
    if not args.dry_run:
        try:
            client = get_supabase_client()
            print("✅ Supabase connection established")
        except Exception as e:
            print(f"❌ Supabase connection failed: {e}")
            return
    else:
        client = None
    
    success_count = 0
    fail_count = 0
    
    for filepath in files:
        if process_file(client, filepath, args.dry_run):
            success_count += 1
        else:
            fail_count += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Results: {success_count} recovered, {fail_count} failed")
    print("=" * 60)


if __name__ == "__main__":
    main()
