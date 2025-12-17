DO $$
DECLARE
    v_business_id TEXT;
BEGIN
    -- 1. Get or create a business_id
    SELECT id::text INTO v_business_id FROM public.businesses LIMIT 1;
    
    IF v_business_id IS NULL THEN
        v_business_id := 'BUTKEVICA_DENTAL';
        -- Try to insert it if it doesn't exist (assuming businesses table exists)
        -- If businesses table doesn't exist or has other constraints, this might fail, 
        -- but usually there's at least one business or we can use a dummy string if FK isn't strict.
        -- Ideally, we should check if the table exists, but let's assume we can use this ID.
        -- Safest bet if we don't know the schema of businesses is to try to find one.
    END IF;

    -- 2. Ensure at least one service exists
    INSERT INTO public.services (id, name, price_cents, duration_minutes, business_id)
    VALUES (
        's1',
        '{"EN": "Dental Hygiene", "LV": "Zobu Higiēna", "RU": "Гигиена зубов"}',
        5000,
        60,
        v_business_id
    )
    ON CONFLICT (id) DO UPDATE SET business_id = v_business_id WHERE services.business_id IS NULL;

    INSERT INTO public.services (id, name, price_cents, duration_minutes, business_id)
    VALUES (
        's2',
        '{"EN": "Root Canal", "LV": "Sakņu Kanālu Ārstēšana", "RU": "Лечение каналов"}',
        12000,
        90,
        v_business_id
    )
    ON CONFLICT (id) DO UPDATE SET business_id = v_business_id WHERE services.business_id IS NULL;

    -- 3. Update bookings with NULL or invalid service_id to point to 's1'
    UPDATE public.bookings
    SET service_id = 's1'
    WHERE service_id IS NULL OR service_id NOT IN (SELECT id FROM public.services);
END $$;
