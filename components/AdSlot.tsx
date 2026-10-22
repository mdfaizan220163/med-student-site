
export default function AdSlot({ label }: { label: string }) {
  return (
    <div className="w-full bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-xs text-gray-400 my-6">
      Ad Slot: {label} <br/>
      Paste AdSense code here after approval
    </div>
  );
}
