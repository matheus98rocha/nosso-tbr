export default function ErrorComponent() {
  const handleRefresh = () => {
    window.location.reload(); // Recarrega a página completamente
  };

  return (
    <div className="flex items-center px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="w-full space-y-6 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl animate-bounce">
            ERRO
          </h1>
          <p className="text-gray-500">Ops... Algo deu errado.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
