"use client";

import React, { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchContacts } from "./actions";
import { ContactSearch } from "@/lib/dto";

interface ContactLookupSearchProps {
  placeholder?: string;
  disabled?: boolean;
  onSearchResults?: (results: ContactSearch[]) => void;
  onSearchError?: (error: string) => void;
  onSearchStart?: () => void;
}

export const ContactLookupSearch: React.FC<ContactLookupSearchProps> = ({
  placeholder = "Search contacts...",
  disabled = false,
  onSearchResults,
  onSearchError,
  onSearchStart,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      onSearchResults?.([]);
      return;
    }

    onSearchStart?.();

    startTransition(async () => {
      try {
        const results = await searchContacts(query);
        onSearchResults?.(results);
      } catch (error) {
        console.error("Search error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An error occurred while searching";
        onSearchError?.(errorMessage);
      }
    });
  };

  const performSearch = () => {
    if (searchTerm.trim()) {
      handleSearch(searchTerm.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const isDisabled = disabled || isPending;

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <Input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={isDisabled}
        className="flex-1"
      />
      <Button
        onClick={performSearch}
        disabled={isDisabled || !searchTerm.trim()}
      >
        {isPending ? "Searching..." : "Search"}
      </Button>
    </div>
  );
};
