#!/usr/bin/env python3
"""
Diagnose and Fix Specialist Assignment Issue
=============================================
This script checks why specialists are not being assigned to bookings
and provides actionable fixes.

Usage: python execution/diagnose_specialist_assignment.py
"""

import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://mugcvpwixdysmhgshobi.supabase.co')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

def diagnose():
    """Run diagnostic checks"""
    
    if not SUPABASE_SERVICE_KEY:
        print("❌ ERROR: SUPABASE_SERVICE_KEY not found in .env")
        print("   Add your service role key to .env file")
        return False
    
    try:
        import requests
    except ImportError:
        print("❌ ERROR: requests library not installed")
        print("   Run: pip install requests")
        return False
    
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json'
    }
    
    print("=" * 60)
    print("SPECIALIST ASSIGNMENT DIAGNOSTIC")
    print("=" * 60)
    
    # Check 1: Fetch specialists
    print("\n[1] Checking specialists table...")
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/specialists?clinic_id=eq.butkevica",
        headers=headers
    )
    
    if resp.status_code != 200:
        print(f"   ❌ Failed to fetch specialists: {resp.text}")
        return False
    
    specialists = resp.json()
    print(f"   Found {len(specialists)} specialists")
    
    for s in specialists:
        is_active = s.get('is_active')
        specialties = s.get('specialties', [])
        status = "✅" if is_active else "❌"
        print(f"   {status} {s['name']}")
        print(f"      is_active: {is_active}")
        print(f"      specialties: {specialties}")
    
    # Check 2: Test the query n8n uses for service butkevica_s2
    print("\n[2] Testing n8n query for service butkevica_s2...")
    filter_url = f"{SUPABASE_URL}/rest/v1/specialists?clinic_id=eq.butkevica&is_active=eq.true&specialties=cs.{{butkevica_s2}}"
    resp = requests.get(filter_url, headers=headers)
    
    if resp.status_code != 200:
        print(f"   ❌ Query failed: {resp.text}")
        return False
    
    qualified = resp.json()
    print(f"   Query returned {len(qualified)} specialists")
    
    if len(qualified) == 0:
        print("   ⚠️  NO SPECIALISTS RETURNED - This is the bug!")
        print("\n   DIAGNOSIS:")
        
        # Check if is_active column exists
        has_inactive = any(s.get('is_active') in [None, False] for s in specialists)
        if has_inactive:
            print("   - Some specialists have is_active = NULL or false")
            print("   → FIX: Run the SQL migration to set is_active = true")
        
        # Check specialties
        for s in specialists:
            specs = s.get('specialties', [])
            if 'butkevica_s2' not in specs:
                print(f"   - {s['name']} doesn't have 'butkevica_s2' in specialties")
    else:
        for s in qualified:
            print(f"   ✅ {s['name']} is qualified")
    
    # Check 3: Look at recent bookings without specialist_id
    print("\n[3] Checking recent bookings without specialist assignment...")
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/bookings?specialist_id=is.null&status=eq.confirmed&limit=5&order=created_at.desc",
        headers=headers
    )
    
    if resp.status_code == 200:
        unassigned = resp.json()
        print(f"   Found {len(unassigned)} recent unassigned bookings")
        for b in unassigned[:3]:
            print(f"   - {b.get('customer_name', 'Unknown')} | {b.get('service_id', 'No service')} | {b.get('start_time', '')[:10]}")
    
    print("\n" + "=" * 60)
    print("RECOMMENDED FIX:")
    print("=" * 60)
    print("""
1. Run this SQL in Supabase SQL Editor:
   
   ALTER TABLE public.specialists 
   ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
   
   UPDATE public.specialists SET is_active = true WHERE is_active IS NULL;

2. Verify specialists have correct specialties:
   - Dr. Jānis Liepiņš should have: butkevica_s1, s2, s4, s6, s8
   - Dr. Elena Petrova should have: butkevica_s3, s4, s5
   - Dr. Anna Bērziņa should have: butkevica_s7, s9, s10, s8

3. If specialties are wrong, re-run the seed SQL:
   platform/widget/sql/02_seed_sample_clinic.sql
""")
    
    return True


if __name__ == "__main__":
    diagnose()
