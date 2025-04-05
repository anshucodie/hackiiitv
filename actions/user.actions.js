"use server";

import User from "../src/models/User";
import dbConnect from "../src/lib/mongo";

export async function createUser(user) {
  try {
    await dbConnect();
    const newUser = await User.create(user);
    console.log("✅ User successfully created in MongoDB:", newUser);
    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    console.error("❌ Error creating user:", error);
    throw new Error("Mongo insert failed");
  }
}

