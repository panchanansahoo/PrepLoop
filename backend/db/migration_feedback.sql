CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    feedback_type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks(created_at DESC);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedbacks' AND policyname = 'Users can insert feedback'
    ) THEN
        CREATE POLICY "Users can insert feedback"
            ON public.feedbacks
            FOR INSERT
            WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedbacks' AND policyname = 'Users can view own feedback'
    ) THEN
        CREATE POLICY "Users can view own feedback"
            ON public.feedbacks
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedbacks' AND policyname = 'Admins can view all feedback'
    ) THEN
        CREATE POLICY "Admins can view all feedback"
            ON public.feedbacks
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;
