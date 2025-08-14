import React from 'react';
import PrinterIcon from './icons/PrinterIcon';
import HospitalIcon from './icons/HospitalIcon';
import LoaderIcon from './icons/LoaderIcon';

interface HeaderProps {
    isLoading: boolean;
    isPdfButtonDisabled: boolean;
    onGeneratePdf: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoading, isPdfButtonDisabled, onGeneratePdf }) => (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-200 pb-6 gap-4">
        <div className="flex items-center gap-4">
            <div className="bg-indigo-500/10 p-3 rounded-2xl ring-1 ring-inset ring-indigo-500/20">
                <HospitalIcon className="h-8 w-8 text-indigo-500" />
            </div>
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">HOSPITAL CIVIL DE GUADALAJARA</h1>
                <p className="text-lg font-medium text-slate-500">Pedido al Almacén de Víveres</p>
            </div>
        </div>
        <button
            onClick={onGeneratePdf}
            disabled={isPdfButtonDisabled}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed transform hover:-translate-y-1"
            aria-live="polite"
        >
            {isLoading ? <LoaderIcon className="h-5 w-5" /> : <PrinterIcon className="h-5 w-5" />}
            {isLoading ? 'Generando...' : 'Generar PDF'}
        </button>
    </header>
);

export default Header;