import { currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <main className="min-h-screen px-6 py-12 bg-white text-gray-900">
      <h2 className="text-3xl font-semibold mb-4">Welcome, {user?.firstName || 'Founder'} 👋</h2>

      <p className="text-gray-600 mb-6">
        Let’s get started creating your legal documents:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
        <div className="border rounded-lg p-5 hover:shadow transition">
          <h3 className="font-bold text-lg mb-2">📝 NDA Generator</h3>
          <p className="text-sm text-gray-500">Quickly generate a non-disclosure agreement.</p>
        </div>
        <div className="border rounded-lg p-5 hover:shadow transition">
          <h3 className="font-bold text-lg mb-2">🤝 Founder Agreement</h3>
          <p className="text-sm text-gray-500">Set expectations with your co-founders.</p>
        </div>
        <div className="border rounded-lg p-5 hover:shadow transition">
          <h3 className="font-bold text-lg mb-2">📑 Employment Contract</h3>
          <p className="text-sm text-gray-500">Generate a simple hiring contract.</p>
        </div>
      </div>
    </main>
  );
}
