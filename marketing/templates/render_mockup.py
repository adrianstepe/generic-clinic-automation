import os

# Configuration
# Configuration
TEMPLATE_PATH = "marketing/templates/modern_dental_site.html"
OUTPUT_DIR = "marketing/outreach"

def generate_mockup(clinic_name, phone, filename_slug):
    """
    Generates a customized HTML file for a clinic.
    """
    # Ensure output directory exists
    target_dir = os.path.join(OUTPUT_DIR, filename_slug)
    os.makedirs(target_dir, exist_ok=True)
    
    # Read Template
    template_to_use = TEMPLATE_PATH
    if not os.path.exists(template_to_use):
        # Fallback for relative path execution
        base_path = os.path.join(os.getcwd(), template_to_use)
        if os.path.exists(base_path):
           template_to_use = base_path
        else:
           print(f"❌ Error: Template not found at {TEMPLATE_PATH}")
           return

    with open(template_to_use, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Substitute
    content = content.replace("{{CLINIC_NAME}}", clinic_name)
    content = content.replace("{{PHONE}}", phone)
    
    # Write Output
    output_path = os.path.join(target_dir, "preview.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"✅ Generated Mockup: {output_path}")

if __name__ == "__main__":
    print("--- Dental Clinic Mockup Generator (Trojan Horse) ---")
    
    # Batch 2 Targets (High Probability)
    clinics = [
        {"name": "Alpha Dental Clinic", "phone": "+371 29206450", "slug": "alpha-dental-clinic"},
        {"name": "ELSIA", "phone": "+371 26726704", "slug": "elsia"},
        {"name": "Dental Shop", "phone": "+371 23079205", "slug": "dental-shop"},
        {"name": "JK Diennakts", "phone": "+371 26557021", "slug": "jk-diennakts"},
        {"name": "Maxilla", "phone": "+371 66002528", "slug": "maxilla"},
        {"name": "ERA Esthetic Dental", "phone": "+371 25333303", "slug": "era-esthetic-dental"},
        {"name": "Aurora Dental", "phone": "+371 67 373 654", "slug": "aurora-dental"},
        {"name": "X-Dental", "phone": "+371 67 552 431", "slug": "x-dental"},
        {"name": "ComfortDent", "phone": "+371 29713775", "slug": "comfortdent"},
        {"name": "Smile Office", "phone": "+371 23302158", "slug": "smile-office"}
    ]
    
    for c in clinics:
        generate_mockup(c["name"], c["phone"], c["slug"])
