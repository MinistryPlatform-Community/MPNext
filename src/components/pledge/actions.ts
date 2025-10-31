"use server";

export type PledgeFormData = {
  campaignId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  courageous_gift: string;
  consistent_gift: string;
  creative_gift: string;
  total_gift: string;
  notes?: string;
};

export type PledgeResult = {
  success: boolean;
  message?: string;
  pledgeId?: number;
  error?: string;
};

export async function savePledge(
  formData: PledgeFormData
): Promise<PledgeResult> {
  try {
    // TODO: Implement Ministry Platform API call
    // This will use MPHelper to create a pledge record with campaignId
    
    console.log("Saving pledge with data:", formData);
    console.log("Campaign ID:", formData.campaignId);

    // Stub: Simulate successful save
    return {
      success: true,
      message: "Pledge saved successfully",
      pledgeId: 12345,
    };
  } catch (error) {
    console.error("Error saving pledge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save pledge",
    };
  }
}
