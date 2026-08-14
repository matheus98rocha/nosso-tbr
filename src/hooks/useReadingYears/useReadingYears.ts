import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

function useReadingYears() {
  return useQuery({
    queryKey: ["readingYears"],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("distinct_reading_years")
        .select("year");

      if (error) {
        throw error;
      }

      return data.map((item) => item.year).sort((a, b) => b - a);
    },
  });
}

export default useReadingYears;
export { useReadingYears };
