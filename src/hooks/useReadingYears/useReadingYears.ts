import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

type UseReadingYearsOptions = {
  /** When false, the query does not run (e.g. defer until section is visible). */
  enabled?: boolean;
};

function useReadingYears(options?: UseReadingYearsOptions) {
  const enabled = options?.enabled ?? true;

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
    enabled,
  });
}

export default useReadingYears;
export { useReadingYears };
