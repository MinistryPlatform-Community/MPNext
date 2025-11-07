"use server";

import { DonorService } from "@/services/donorService";
import { PledgeService } from "@/services/pledgeService";
import { ConfigurationService } from "@/services/configurationService";
import { PledgesInput } from "@/lib/providers/ministry-platform/models/PledgesSchema";

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
    console.log("=== PLEDGE SUBMISSION START ===");
    console.log("📋 Form Data:");
    console.log("  Campaign ID:", formData.campaignId);
    console.log("  First Name:", formData.firstName);
    console.log("  Last Name:", formData.lastName);
    console.log("  Email:", formData.email);
    console.log("  Phone:", formData.phone);
    console.log("  Address:", formData.address);
    console.log("  City:", formData.city);
    console.log("  State:", formData.state);
    console.log("  Zipcode:", formData.zipcode);
    console.log("💰 Gift Amounts:");
    console.log("  Courageous Gift: $" + formData.courageous_gift);
    console.log("  Consistent Gift: $" + formData.consistent_gift);
    console.log("  Creative Gift: $" + formData.creative_gift);
    console.log("  Total Gift: $" + formData.total_gift);
    if (formData.notes) {
      console.log("📝 Notes:", formData.notes);
    }

    // Step 1: Find the donor
    const donorService = await DonorService.getInstance();
    const donor = await donorService.findDonor(
      formData.firstName,
      formData.lastName,
      formData.email
    );

    let donorId: number;

    if (donor === null) {
      console.log("❌ DONOR NOT FOUND");
      console.log("Search criteria:", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });
      
      const configService = await ConfigurationService.getInstance();
      const defaultDonorId = await configService.getConfigurationValue<number>(
        "Common",
        "defaultDonorID"
      );
      
      if (!defaultDonorId) {
        throw new Error("Default donor ID not configured");
      }
      
      donorId = defaultDonorId;
      console.log("ℹ️ Using default donor ID:", donorId);
    } else {
      console.log("✅ DONOR FOUND");
      console.log("Contact_ID:", donor.Donor_Record);
      
      if (!donor.Donor_Record) {
        const configService = await ConfigurationService.getInstance();
        const defaultDonorId = await configService.getConfigurationValue<number>(
          "Common",
          "defaultDonorID"
        );
        
        if (!defaultDonorId) {
          throw new Error("Default donor ID not configured and donor record is null");
        }
        
        donorId = defaultDonorId;
        console.log("ℹ️ Donor_Record is null, using default donor ID:", donorId);
      } else {
        donorId = donor.Donor_Record;
      }
    }

    // Step 2: Create the pledge
    const pledgeService = await PledgeService.getInstance();
    
    // Build formatted contact info for notes
    const contactInfo = `First Name: ${formData.firstName}
Last Name: ${formData.lastName}
Phone: ${formData.phone}
Email: ${formData.email}
Address1: ${formData.address}
Address2: 
City, State Zip: ${formData.city}, ${formData.state} ${formData.zipcode}
Country: USA`;

    const notes = formData.notes 
      ? `${contactInfo}\n\nCreative Notes: ${formData.notes}`
      : contactInfo;
    
    console.log("🔍 DEBUG - formData.notes value:", formData.notes);
    console.log("🔍 DEBUG - formData.notes type:", typeof formData.notes);
    console.log("🔍 DEBUG - formData.notes truthy?:", !!formData.notes);
    console.log("🔍 DEBUG - final notes string:", notes);
    
    const pledgeInput: Partial<PledgesInput> = {
      Donor_ID: donorId,
      Pledge_Campaign_ID: formData.campaignId,
      Pledge_Status_ID: 1,
      Total_Pledge: parseFloat(formData.total_gift),
      Installments_Planned: 1,
      Installments_Per_Year: 1,
      First_Installment_Date: new Date().toISOString(),
      Notes: notes,
      Beneficiary: null,
      Trip_Leader: false,
      Currency: "USD",
      Parish_Credited_ID: null,
      Parish_Credited_Unknown: false,
      Donation_Source_ID: null,
      Send_Pledge_Statement: false,
      Batch_ID: null,
    };

    console.log("💾 Creating pledge with data:", pledgeInput);
    console.log("📝 Notes field content:", pledgeInput.Notes);

    const pledge = await pledgeService.createPledge(pledgeInput);

    console.log("✅ Pledge created successfully!");
    console.log("Pledge_ID:", pledge.Pledge_ID);
    console.log("=== PLEDGE SUBMISSION END ===");

    return {
      success: true,
      message: "Pledge saved successfully",
      pledgeId: pledge.Pledge_ID,
    };
  } catch (error) {
    console.error("❌ Error saving pledge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save pledge",
    };
  }
}
