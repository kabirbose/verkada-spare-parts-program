import { Schema, model, models } from "mongoose";
import { ICartItem } from "./Cart";

export interface ISubmission {
  supportEngineerName: string;
  caseNumber: string;
  companyName: string;
  customerAddress: string;
  attentionTo: string;
  shippingMethod: "standard" | "expedited";
  contactInfo: string;
  notes: string;
  items: ICartItem[];
  createdAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    supportEngineerName: { type: String, required: true },
    caseNumber: { type: String, required: true },
    companyName: { type: String, required: true },
    customerAddress: { type: String, required: true },
    attentionTo: { type: String, required: true },
    shippingMethod: { type: String, enum: ["standard", "expedited"], required: true },
    contactInfo: { type: String, required: true },
    notes: { type: String, default: "" },
    items: [
      {
        partId: { type: String, required: true },
        partName: { type: String, required: true },
        quantity: { type: Number, required: true },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

export const Submission = models.Submission || model<ISubmission>("Submission", SubmissionSchema);
