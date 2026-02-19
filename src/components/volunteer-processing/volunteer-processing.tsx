"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VolunteerCard as VolunteerCardData, GroupFilterOption } from "@/lib/dto";
import { VolunteerCard } from "./volunteer-card";
import { VolunteerDetailModal } from "./volunteer-detail-modal";
import { getInProcessVolunteers, getApprovedVolunteers } from "./actions";

const isDev = process.env.NODE_ENV === "development";

export function VolunteerProcessing() {
  const [activeTab, setActiveTab] = useState("in-process");
  const [inProcessVolunteers, setInProcessVolunteers] = useState<VolunteerCardData[]>([]);
  const [approvedVolunteers, setApprovedVolunteers] = useState<VolunteerCardData[]>([]);
  const [approvedGroups, setApprovedGroups] = useState<GroupFilterOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerCardData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async (tab: string) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "in-process") {
        const data = await getInProcessVolunteers();
        setInProcessVolunteers(data);
      } else {
        const result = await getApprovedVolunteers();
        setApprovedVolunteers(result.volunteers);
        setApprovedGroups(result.groups);
      }
    } catch (err) {
      console.error("Failed to fetch volunteers:", err);
      setError("Failed to load volunteers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const handleCardClick = (volunteer: VolunteerCardData) => {
    setSelectedVolunteer(volunteer);
    setModalOpen(true);
  };

  const handleUpdate = () => {
    fetchData(activeTab);
  };

  const filteredApprovedVolunteers = useMemo(() => {
    if (!selectedGroupId) return approvedVolunteers;
    return approvedVolunteers.filter(v => v.groupIds.includes(selectedGroupId));
  }, [approvedVolunteers, selectedGroupId]);

  const currentVolunteers = activeTab === "in-process" ? inProcessVolunteers : filteredApprovedVolunteers;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Volunteer Processing</h1>
        <p className="text-muted-foreground">
          Track volunteer onboarding progress and manage approved volunteers.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="in-process">
            New Volunteers In Process
            {inProcessVolunteers.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {inProcessVolunteers.length}
              </span>
            )}
          </TabsTrigger>
          {isDev && (
            <TabsTrigger value="approved">
              Approved Active Volunteers
              {approvedVolunteers.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {approvedVolunteers.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="in-process">
          <VolunteerGrid
            volunteers={currentVolunteers}
            loading={loading && activeTab === "in-process"}
            error={error}
            emptyMessage="No volunteers currently in process."
            onCardClick={handleCardClick}
          />
        </TabsContent>

        {isDev && (
          <TabsContent value="approved">
            {approvedGroups.length > 1 && (
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="group-filter" className="text-sm font-medium text-gray-700">
                  Filter by group:
                </label>
                <select
                  id="group-filter"
                  value={selectedGroupId ?? ""}
                  onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">All Groups ({approvedVolunteers.length})</option>
                  {approvedGroups.map((group) => {
                    const count = approvedVolunteers.filter(v => v.groupIds.includes(group.Group_ID)).length;
                    return (
                      <option key={group.Group_ID} value={group.Group_ID}>
                        {group.Group_Name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            <VolunteerGrid
              volunteers={currentVolunteers}
              loading={loading && activeTab === "approved"}
              error={error}
              emptyMessage="No approved volunteers found."
              onCardClick={handleCardClick}
            />
          </TabsContent>
        )}
      </Tabs>

      <VolunteerDetailModal
        volunteer={selectedVolunteer}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={handleUpdate}
      />
    </div>
  );
}

function VolunteerGrid({
  volunteers,
  loading,
  error,
  emptyMessage,
  onCardClick,
}: {
  volunteers: VolunteerCardData[];
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  onCardClick: (volunteer: VolunteerCardData) => void;
}) {
  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading volunteers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500 bg-red-50 rounded-md">
        {error}
      </div>
    );
  }

  if (volunteers.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
      {volunteers.map((volunteer) => (
        <VolunteerCard
          key={volunteer.info.Group_Participant_ID}
          volunteer={volunteer}
          onClick={() => onCardClick(volunteer)}
        />
      ))}
    </div>
  );
}
