
import React, { useState, useCallback } from 'react';
import { Item, Articulo } from './types';
import HospitalIcon from './components/icons/HospitalIcon';
import PrinterIcon from './components/icons/PrinterIcon';

declare const jspdf: any;

// Predefined list of articles for the dropdown
const ARTICULOS_DISPONIBLES: Articulo[] = [
  { codigo: '', descripcion: 'Seleccione un artículo...', unidad: '' },
  { codigo: '0101', descripcion: 'Aceite de Maíz', unidad: 'PZA' },
  { codigo: '0102', descripcion: 'Arroz Super Extra', unidad: 'KG' },
  { codigo: '0103', descripcion: 'Frijol Negro', unidad: 'KG' },
  { codigo: '0201', descripcion: 'Leche Entera', unidad: 'LT' },
  { codigo: '0202', descripcion: 'Queso Panela', unidad: 'KG' },
  { codigo: '0301', descripcion: 'Manzana Golden', unidad: 'KG' },
  { codigo: '0302', descripcion: 'Pollo Entero', unidad: 'KG' },
  { codigo: '0303', descripcion: 'Huevo Blanco', unidad: 'KG' },
];


const App: React.FC = () => {
    const [partida] = useState('2212');
    const [unidad] = useState('Fray Antonio Alcalde');
    const [fecha] = useState(new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }));
    const [servicio, setServicio] = useState('');
    const [cuenta, setCuenta] = useState('');
    const [recibidoPor, setRecibidoPor] = useState('');
    const [nombreRud, setNombreRud] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [item, setItem] = useState<Item>({
        codigo: '', descripcion: '', unidad: '', cantidadPedida: '', cantidadSurtida: '', observaciones: ''
    });

    const handleItemChange = (field: 'cantidadPedida' | 'observaciones', value: string) => {
        setItem(prevItem => ({ ...prevItem, [field]: value }));
    };

    const handleArticleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDescription = e.target.value;
        const selectedArticle = ARTICULOS_DISPONIBLES.find(art => art.descripcion === selectedDescription);
        if (selectedArticle) {
            setItem(prevItem => ({
                ...prevItem,
                codigo: selectedArticle.codigo,
                descripcion: selectedArticle.descripcion,
                unidad: selectedArticle.unidad,
            }));
        } else {
             setItem(prevItem => ({
                ...prevItem,
                codigo: '',
                descripcion: '',
                unidad: '',
            }));
        }
    };

    const generatePdf = useCallback(() => {
        setIsLoading(true);
        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'letter'
            });

            // --- Header ---
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            
            // Recreating the H.C.G logo box as text, as in the original form
            const drawLogoBox = (x: number) => {
                const y = 10;
                doc.rect(x, y, 10, 18); // Box
                doc.text('H.C.G.', x + 5, y + 5, { align: 'center' });
                doc.setFont('helvetica', 'italic');
                doc.text('PIENSA Y', x + 5, y + 9, { align: 'center' });
                doc.text('TRABAJA', x + 5, y + 13, { align: 'center' });
                doc.setFont('helvetica', 'normal');
            };
            
            drawLogoBox(10);
            drawLogoBox(262);
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('HOSPITAL CIVIL DE GUADALAJARA', 140, 15, { align: 'center' });
            doc.setFontSize(11);
            doc.text('PEDIDO AL ALMACEN VIVERES', 140, 22, { align: 'center' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            
            // Header fields
            doc.text(`Partida Presupuestal:`, 45, 33);
            doc.setFont('helvetica', 'normal');
            doc.text(partida, 78, 33);
            doc.line(77, 34, 105, 34);
            
            doc.setFont('helvetica', 'bold');
            doc.text(`Unidad Hospitalaria:`, 110, 33);
            doc.setFont('helvetica', 'normal');
            doc.text(unidad, 145, 33);
            doc.line(144, 34, 200, 34);

            doc.setFont('helvetica', 'bold');
            doc.text(`FECHA:`, 15, 40);
            doc.setFont('helvetica', 'normal');
            doc.text(fecha, 30, 40);
            doc.line(29, 41, 60, 41);

            doc.setFont('helvetica', 'bold');
            doc.text(`SERVICIO:`, 80, 40);
            doc.setFont('helvetica', 'normal');
            doc.text(servicio, 100, 40);
            doc.line(99, 41, 150, 41);
            
            doc.setFont('helvetica', 'bold');
            doc.text(`CUENTA:`, 180, 40);
            doc.setFont('helvetica', 'normal');
            doc.text(cuenta, 198, 40);
            doc.line(197, 41, 230, 41);


            // --- Table ---
            const tableColumn = [["CODIGO", "DESCRIPCION DEL ARTICULO", "UNIDAD", {content: 'CANTIDAD\nPEDIDA', styles: {halign: 'center'}}, {content: 'CANTIDAD\nSURTIDA', styles: {halign: 'center'}}, "CANTIDAD SURTIDA CON LETRA/\nOBSERVACIONES"]];
            const tableRows: (string | number | object)[][] = [];

            const itemData = [
                item.codigo,
                item.descripcion,
                item.unidad,
                {content: item.cantidadPedida, styles: {halign: 'center'}},
                {content: item.cantidadSurtida, styles: {halign: 'center'}},
                item.observaciones
            ];
            tableRows.push(itemData);

            const totalRowsOnForm = 16;
            while(tableRows.length < totalRowsOnForm){
                tableRows.push(["", "", "", "", "", ""]);
            }

            doc.autoTable({
                head: tableColumn,
                body: tableRows,
                startY: 45,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    valign: 'middle',
                    minCellHeight: 7
                },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center',
                },
                 columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 85 },
                    2: { cellWidth: 15, halign: 'center' },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 65 },
                },
                didDrawPage: (data: any) => {
                  const finalY = data.cursor.y;
                  doc.setLineWidth(0.5);
                  doc.rect(10, finalY, 262, 20); // main footer box
                  doc.line(10, finalY + 10, 175, finalY + 10); // horizontal line
                  doc.line(175, finalY, 175, finalY + 20); // vertical line
                  doc.line(75, finalY + 10, 75, finalY + 20); // vertical line for signature box separation


                  doc.setFontSize(8);
                  doc.setFont('helvetica', 'bold');
                  doc.text('RECIBIDO POR', 218.5, finalY + 7, { align: 'center' });
                  doc.text('NOMBRE Y RUD', 125, finalY + 15, { align: 'center' });

                  doc.setFont('helvetica', 'normal');
                  doc.text(nombreRud, 15, finalY+15);
                  doc.text(recibidoPor, 180, finalY+7);

                },
            });

            doc.output('dataurlnewwindow');

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
        } finally {
            setIsLoading(false);
        }
    }, [partida, unidad, fecha, servicio, cuenta, nombreRud, recibidoPor, item]);


    return (
        <div className="container mx-auto p-4 sm:p-8 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-6 border-gray-200 gap-4">
                    <div className="flex items-center gap-4">
                        <HospitalIcon className="h-12 w-12 text-red-900 flex-shrink-0" />
                        <div>
                             <h1 className="text-xl sm:text-2xl font-bold text-gray-800">HOSPITAL CIVIL DE GUADALAJARA</h1>
                             <h2 className="text-lg sm:text-xl font-semibold text-gray-600">PEDIDO AL ALMACEN VIVERES</h2>
                        </div>
                    </div>
                    <button
                        onClick={generatePdf}
                        disabled={isLoading || !item.descripcion || item.descripcion === "Seleccione un artículo..."}
                        className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                        <PrinterIcon className="h-5 w-5" />
                        {isLoading ? 'Generando...' : 'Generar PDF para Imprimir'}
                    </button>
                </div>


                {/* Form Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partida Presupuestal</label>
                        <input type="text" value={partida} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Hospitalaria</label>
                        <input type="text" value={unidad} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input type="text" value={fecha} readOnly className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                        <input type="text" value={servicio} onChange={e => setServicio(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej. Nutrición"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
                        <input type="text" value={cuenta} onChange={e => setCuenta(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej. 12345"/>
                    </div>
                </div>

                {/* Item Details Section */}
                <div className="mt-6 border-t pt-6 border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles del Artículo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        <div className="lg:col-span-2">
                            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción del Artículo</label>
                            <select
                                id="descripcion"
                                value={item.descripcion}
                                onChange={handleArticleChange}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                aria-label="Seleccione un artículo"
                            >
                                {ARTICULOS_DISPONIBLES.map(art => (
                                    <option key={art.codigo || 'default'} value={art.descripcion}>{art.descripcion}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="cantidadPedida" className="block text-sm font-medium text-gray-700 mb-1">Cantidad Pedida</label>
                            <input
                                id="cantidadPedida"
                                type="number"
                                value={item.cantidadPedida}
                                onChange={e => handleItemChange('cantidadPedida', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ej. 10"
                            />
                        </div>

                        <div>
                            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                            <input
                                id="codigo"
                                type="text"
                                value={item.codigo}
                                readOnly
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                            <input
                                id="unidad"
                                type="text"
                                value={item.unidad}
                                readOnly
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label htmlFor="cantidadSurtida" className="block text-sm font-medium text-gray-700 mb-1">Cantidad Surtida</label>
                            <input
                                id="cantidadSurtida"
                                type="text"
                                value={item.cantidadSurtida}
                                readOnly
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                                placeholder="(Llenado por almacén)"
                            />
                        </div>
                        
                        <div className="lg:col-span-3">
                            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-1">Cantidad Surtida con Letra / Observaciones</label>
                            <input
                                id="observaciones"
                                type="text"
                                value={item.observaciones}
                                onChange={e => handleItemChange('observaciones', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Escribir cantidad con letra u otras notas"
                            />
                        </div>
                    </div>
                </div>


                {/* Footer Section */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-200">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y RUD (Quien solicita)</label>
                        <input type="text" value={nombreRud} onChange={e => setNombreRud(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Firma y datos de quien solicita"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Recibido por (Almacén)</label>
                        <input type="text" value={recibidoPor} onChange={e => setRecibidoPor(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Firma de quien recibe en almacén"/>
                    </div>
                 </div>

            </div>
        </div>
    );
};

export default App;
