import dbConnect from '@/lib/mongo';
import User from '@/models/User';

export async function POST(req) {
  const body = await req.json();
  const { id, email_addresses, first_name, last_name } = body.data;

  await dbConnect();

  const email = email_addresses?.[0]?.email_address;

  const existingUser = await User.findOne({ clerkId: id });
  if (existingUser) {
    return new Response('User already exists', { status: 200 });
  }

  await User.create({
    clerkId: id,
    email: email,
    name: `${first_name} ${last_name}`,
  });

  return new Response('User synced to MongoDB', { status: 200 });
}
