#!/usr/bin/env python3
"""
Update clinic address and email in n8n workflow JSON files.
Works by parsing JSON properly and modifying jsCode strings.
"""
import json
import os
import re

# New values
NEW_ADDRESS = 'Dzirnavu iela 45, Centra rajons, Rīga, LV-1010'
NEW_EMAIL = 'info@drbutkevicadentalpractice.com'
NEW_MAPS_URL = 'https://maps.google.com/?q=Dzirnavu+iela+45,+Riga,+Latvia'

# Old patterns to replace
OLD_ADDRESS_PATTERNS = [
    r"Dzirnavu iela 62A, Centra rajons, Rīga, LV-1050",
    r"Dzirnavu iela 62A, Centra rajons, Rīga",
    r"Dzirnavu iela 62A, Rīga",
    r"Dzirnavu iela 62A, Riga",
]

# We also need to replace in SMS messages: "Dzirnavu iela 62A."
OLD_SMS_ADDRESS = "Dzirnavu iela 62A."
NEW_SMS_ADDRESS = "Dzirnavu iela 45."

# Files to update
WORKFLOW_DIR = '/home/as/Desktop/Antigravity/Workspace/src/widget/butkevica-dental-booking/workflows'
WORKFLOW_FILES = [
    'n8n-2-stripe-confirmation-supabase.json',
    'n8n-5-google-review-request.json', 
    'n8n-7-daily-reminders-and-recall.json',
]

def update_string(s):
    """Update addresses in a string (typically jsCode or message fields)."""
    # Replace full addresses
    for pattern in OLD_ADDRESS_PATTERNS:
        s = s.replace(pattern, NEW_ADDRESS)
    
    # Replace SMS short address
    s = s.replace(OLD_SMS_ADDRESS, NEW_SMS_ADDRESS)
    
    # Replace Maps URL
    s = s.replace(
        'https://maps.google.com/?q=Dzirnavu+iela+62A,+Riga,+Latvia',
        NEW_MAPS_URL
    )
    
    # Add CLINIC_EMAIL if CLINIC_ADDRESS exists but CLINIC_EMAIL doesn't
    if 'CLINIC_ADDRESS' in s and 'CLINIC_EMAIL' not in s:
        s = s.replace(
            f"const CLINIC_ADDRESS = '{NEW_ADDRESS}';",
            f"const CLINIC_EMAIL = '{NEW_EMAIL}';\\nconst CLINIC_ADDRESS = '{NEW_ADDRESS}';"
        )
    
    return s

def update_node(node):
    """Recursively update strings in a node."""
    if isinstance(node, dict):
        for key, value in node.items():
            if key == 'jsCode' and isinstance(value, str):
                node[key] = update_string(value)
            elif key == 'message' and isinstance(value, str):
                node[key] = update_string(value)
            else:
                update_node(value)
    elif isinstance(node, list):
        for item in node:
            update_node(item)

def update_workflow(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Update all nodes
    update_node(data)
    
    # Write back with proper formatting
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    
    print(f"✅ {os.path.basename(filepath)} - updated successfully")

if __name__ == '__main__':
    for wf_file in WORKFLOW_FILES:
        filepath = os.path.join(WORKFLOW_DIR, wf_file)
        if os.path.exists(filepath):
            try:
                update_workflow(filepath)
            except Exception as e:
                print(f"❌ {wf_file}: {e}")
        else:
            print(f"⚠️ {wf_file} not found")
