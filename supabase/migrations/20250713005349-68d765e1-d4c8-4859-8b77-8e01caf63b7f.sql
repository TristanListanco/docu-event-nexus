
-- Create borrowing_records table for equipment borrowing tracking
CREATE TABLE public.borrowing_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  borrower_name TEXT NOT NULL,
  equipment_names TEXT[] NOT NULL,
  date_taken DATE NOT NULL,
  time_taken TIME NOT NULL,
  date_returned DATE,
  time_returned TIME,
  status TEXT NOT NULL CHECK (status IN ('borrowed', 'returned')) DEFAULT 'borrowed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.borrowing_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for borrowing_records
CREATE POLICY "Users can view their own borrowing records" 
  ON public.borrowing_records 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own borrowing records" 
  ON public.borrowing_records 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own borrowing records" 
  ON public.borrowing_records 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own borrowing records" 
  ON public.borrowing_records 
  FOR DELETE 
  USING (auth.uid() = user_id);
