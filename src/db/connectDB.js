import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n🌸 MongoDB connected 👍 !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (err) {
    console.error("❌👎👎MONGODB CONNECTION FAILED", err);
    process.exit(1);
  }
};

export default connectDB;
