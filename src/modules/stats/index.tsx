"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const readers = ["Matheus", "Fabi", "Barbara"];

export function StatsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const readerParam = searchParams.get("reader") ?? readers[0];

  const [reader, setReader] = useState(readerParam);

  useEffect(() => {
    setReader(readerParam);
  }, [readerParam]);

  function onChange(value: string) {
    router.push(`/stats?reader=${value}`);
  }

  return (
    <Select onValueChange={onChange} defaultValue={reader}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a reader" />
      </SelectTrigger>
      <SelectContent>
        {readers.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
