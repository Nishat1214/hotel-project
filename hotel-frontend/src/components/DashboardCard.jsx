const DashboardCard = ({ label, value, icon, color = "#1E3A8A" }) => {
  return (
    <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

export default DashboardCard;