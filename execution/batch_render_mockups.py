import json
import os
import shutil

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Workspace root
TARGETS_FILE = os.path.join(BASE_DIR, 'marketing', 'leads', 'targets.json')
TEMPLATE_FILE = os.path.join(BASE_DIR, 'marketing', 'templates', 'modern_dental_site.html')
DEPLOYMENTS_DIR = os.path.join(BASE_DIR, 'marketing', 'deployments')

def generate_mockups():
    # 1. Load Targets
    print(f"Reading targets from {TARGETS_FILE}...")
    try:
        with open(TARGETS_FILE, 'r', encoding='utf-8') as f:
            targets = json.load(f)
    except FileNotFoundError:
        print(f"Error: {TARGETS_FILE} not found.")
        return

    # 2. Load Template
    print(f"Reading template from {TEMPLATE_FILE}...")
    try:
        with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
            template_content = f.read()
    except FileNotFoundError:
        print(f"Error: {TEMPLATE_FILE} not found.")
        return

    # 3. Process Each Target
    if not os.path.exists(DEPLOYMENTS_DIR):
        os.makedirs(DEPLOYMENTS_DIR)

    generated_count = 0
    for clinic in targets:
        print(f"Generating mockup for: {clinic['name']} ({clinic['slug']})")
        
        # Create Content
        page_content = template_content.replace('{{CLINIC_NAME}}', clinic['name'])
        page_content = page_content.replace('{{PHONE}}', clinic['phone'])
        
        # Create Directory
        clinic_dir = os.path.join(DEPLOYMENTS_DIR, clinic['slug'])
        if not os.path.exists(clinic_dir):
            os.makedirs(clinic_dir)
            
        # Write File
        output_path = os.path.join(clinic_dir, 'index.html')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(page_content)
            
        generated_count += 1

    print(f"✅ Successfully generated {generated_count} mockups in {DEPLOYMENTS_DIR}")

if __name__ == "__main__":
    generate_mockups()
