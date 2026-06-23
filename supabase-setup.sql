-- Profile Table
CREATE TABLE IF NOT EXISTS public.profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT,
    title TEXT,
    location TEXT,
    about_text TEXT,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    cv_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Experience Table
CREATE TABLE IF NOT EXISTS public.experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT,
    company TEXT,
    location TEXT,
    dates TEXT,
    responsibilities TEXT[], -- Array of strings
    is_current BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Skills Table
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    level INTEGER, -- Percentage
    category TEXT, -- 'operational', 'technical', 'tag'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    issuer TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Storage Buckets Setup
-- Run these in the Supabase Dashboard -> Storage section:
-- 1. Create a public bucket named 'documents'
-- 2. Create a public bucket named 'assets'

-- Enable Row Level Security (RLS)
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow everyone to select, only authenticated to insert/update)
CREATE POLICY "Public Read Profile" ON public.profile FOR SELECT USING (true);
CREATE POLICY "Admin Update Profile" ON public.profile FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Experience" ON public.experience FOR SELECT USING (true);
CREATE POLICY "Admin Update Experience" ON public.experience FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Admin Update Skills" ON public.skills FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Admin Update Certificates" ON public.certificates FOR ALL USING (auth.role() = 'authenticated');
