'use client';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
      <SignUp />
    </div>
  );
}
