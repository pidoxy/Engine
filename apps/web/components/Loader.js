export default function Loader({ size = "md", color = "blue" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const colorClasses = {
    blue: "border-blue-500",
    gray: "border-gray-500",
    white: "border-white"
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        border-2 border-t-transparent 
        rounded-full 
        animate-spin
      `}
    />
  );
}