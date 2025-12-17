-- 1. Add doctor_id column to bookings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'doctor_id') THEN
        ALTER TABLE public.bookings ADD COLUMN doctor_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Update RLS policies to allow doctors to see their own bookings
DROP POLICY IF EXISTS "Doctors can view their own bookings" ON public.bookings;

CREATE POLICY "Doctors can view their own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (
    doctor_id = auth.uid()
);

-- 3. Insert a dummy booking for the current user
DO $$
DECLARE
    v_business_id TEXT;
    v_service_id TEXT;
    v_start_time TIMESTAMPTZ;
BEGIN
    -- Attempt to find a valid business_id
    SELECT business_id INTO v_business_id FROM public.bookings WHERE business_id IS NOT NULL LIMIT 1;

    IF v_business_id IS NULL THEN
        BEGIN
            EXECUTE 'SELECT id::text FROM public.businesses LIMIT 1' INTO v_business_id;
        EXCEPTION WHEN OTHERS THEN
            v_business_id := NULL;
        END;
    END IF;

    IF v_business_id IS NULL THEN
         v_business_id := 'BUTKEVICA_DENTAL';
    END IF;

    -- Get a service ID
    SELECT id INTO v_service_id FROM public.services LIMIT 1;
    IF v_service_id IS NULL THEN
        v_service_id := 's1';
    END IF;

    -- Set start time
    v_start_time := NOW() + INTERVAL '1 day';

    -- Insert the booking
    INSERT INTO public.bookings (
        created_at,
        customer_name,
        customer_email,
        start_time,
        end_time, -- Added end_time
        status,
        doctor_id,
        service_id,
        business_id
    )
    VALUES (
        NOW(),
        'Test Patient',
        'test.patient@example.com',
        v_start_time,
        v_start_time + INTERVAL '1 hour', -- Calculate end_time (1 hour duration)
        'confirmed',
        auth.uid(),
        v_service_id,
        v_business_id
    );
END $$;
