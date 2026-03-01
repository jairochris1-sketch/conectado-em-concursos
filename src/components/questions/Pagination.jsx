import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}) {
  const [goToPage, setGoToPage] = useState('');

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage);
    if (pageNumber && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
      setGoToPage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };

  const getVisiblePages = () => {
    const delta = 5; // Mostra mais páginas como na imagem
    const range = [];
    const rangeWithDots = [];

    // Sempre mostrar primeira página
    if (totalPages > 1) {
      rangeWithDots.push(1);
    }

    // Calcular range ao redor da página atual
    for (let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++) {
      range.push(i);
    }

    // Adicionar "..." se necessário antes do range
    if (currentPage - delta > 2) {
      rangeWithDots.push('...');
    }

    // Adicionar o range
    rangeWithDots.push(...range);

    // Adicionar "..." se necessário depois do range
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...');
    }

    // Sempre mostrar última página (se não for a primeira)
    if (totalPages > 1 && !rangeWithDots.includes(totalPages)) {
      rangeWithDots.push(totalPages);
    }

    // Remover duplicatas
    return rangeWithDots.filter((page, index, array) => array.indexOf(page) === index);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-0">
      <div className="flex flex-col gap-4">
        {/* Info dos itens */}
        <div className="text-sm text-gray-700 text-center md:text-left">
          Mostrando <span className="font-medium">{startItem}</span> a{' '}
          <span className="font-medium">{endItem}</span> de{' '}
          <span className="font-medium">{totalItems}</span>
        </div>

        {/* Controles de paginação */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {/* Navegação por páginas */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2">

              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {visiblePages.map((page, index) => {
                if (page === '...') {
                  return (
                    <div key={`dots-${index}`} className="px-2 py-1">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </div>);

                }

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className={`min-w-[36px] ${
                    currentPage === page ?
                    'bg-blue-600 text-white hover:bg-blue-700' :
                    'text-gray-700 hover:bg-blue-50'}`
                    }>

                    {page}
                  </Button>);

              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages} className="bg-blue-600 px-2 text-xs font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input shadow-sm hover:bg-accent hover:text-accent-foreground h-8">


              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Campo "Ir para página" */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Ir para a página:
            </span>
            <Input
              type="number"
              min="1"
              max={totalPages}
              value={goToPage}
              onChange={(e) => setGoToPage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="1"
              className="w-20 h-8 text-center" />

            <Button
              size="sm"
              onClick={handleGoToPage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4">

              OK
            </Button>
          </div>
        </div>
      </div>
    </div>);

}