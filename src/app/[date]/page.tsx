import DatePage from "@/components/DatePage";

export default async function DateRoute({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-2xl mb-2">Invalid date format</p>
        <p className="text-sm">Use YYYY-MM-DD format</p>
      </div>
    );
  }

  return <DatePage date={date} />;
}
