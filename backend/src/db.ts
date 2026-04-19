import mongoose from "mongoose";

const defaultUri = "mongodb://127.0.0.1:27017/smart_spend";

export const connectToDatabase = async () => {
  const uri = process.env.MONGODB_URI ?? defaultUri;
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${uri}`);
};
