import React from "react";

const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen min-w-screen bg-gray-50">
      <div className="w-6 h-6 border-4 border-t-4 border-primary-200 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
};

export default Loading;
