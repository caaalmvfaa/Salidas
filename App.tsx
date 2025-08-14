import React, { useState, useEffect, useCallback } from 'react';
import { Item, Articulo } from './types';
import { personalEntrega, personalRecibe } from './personnel';
import { convertirNumeroALetras } from './numberToWords';

// Import new components
import Header from './components/Header';
import MetadataForm from './components/MetadataForm';
import ItemList from './components/ItemList';
import SignatureFields from './components/SignatureFields';

declare const jspdf: any;

const App: React.FC = () => {
    const [partida] = useState('2212');
    const [unidad] = useState('Fray Antonio Alcalde');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [servicio, setServicio] = useState('Comedor');
    const [cuenta] = useState('2212'); // Fixed value
    const [entregadoPorId, setEntregadoPorId] = useState<string>('');
    const [recibidoPorId, setRecibidoPorId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [articulos, setArticulos] = useState<Articulo[]>([]);
    
    const initialItem: Item = { id: Date.now().toString(), codigo: '', descripcion: '', unidad: '', cantidadPedida: '', cantidadSurtida: '', observaciones: '' };
    const [items, setItems] = useState<Item[]>([initialItem]);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(initialItem.id);

    useEffect(() => {
        const fetchArticulos = async () => {
            try {
                const response = await fetch('/articulos.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: Articulo[] = await response.json();
                const defaultOption: Articulo = { "Codigo": "", "Articulo": "Seleccione un artículo...", "Unidad Medida": "" };
                setArticulos([defaultOption, ...data]);
            } catch (error) {
                console.error("No se pudieron cargar los artículos:", error);
                alert("Error al cargar la lista de artículos. Por favor, recargue la página.");
            }
        };
        fetchArticulos();
    }, []);

    const handleItemChange = (id: string, field: keyof Item, value: string) => {
        setItems(prevItems =>
            prevItems.map(item => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const handleArticleChange = (id: string, e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDescription = e.target.value;
        const selectedArticle = articulos.find(art => art.Articulo === selectedDescription);
        
        setItems(prevItems =>
            prevItems.map(item => {
                if (item.id === id) {
                    if (selectedArticle && selectedArticle.Codigo) {
                        return {
                            ...item,
                            codigo: selectedArticle.Codigo,
                            descripcion: selectedArticle.Articulo,
                            unidad: selectedArticle['Unidad Medida'],
                        };
                    } else {
                        return {
                            ...item,
                            codigo: '',
                            descripcion: '',
                            unidad: '',
                        };
                    }
                }
                return item;
            })
        );
    };

    const addItem = () => {
        const newItemId = Date.now().toString();
        const newItem: Item = {
            id: newItemId,
            codigo: '',
            descripcion: '',
            unidad: '',
            cantidadPedida: '',
            cantidadSurtida: '',
            observaciones: ''
        };
        setItems(prevItems => [...prevItems, newItem]);
        setExpandedItemId(newItemId);
    };

    const deleteItem = (id: string) => {
        const newItems = items.filter(item => item.id !== id);
        setItems(newItems);

        if (expandedItemId === id) {
            if (newItems.length > 0) {
                setExpandedItemId(newItems[newItems.length - 1].id);
            } else {
                setExpandedItemId(null);
            }
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

            doc.setTextColor(0, 0, 0); // Set default text color to black for all text elements

            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 10;
            
            // --- Header Titles ---
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('HOSPITAL CIVIL DE GUADALAJARA', pageWidth / 2, 18, { align: 'center' });
            doc.setFontSize(11);
            doc.text('PEDIDO AL ALMACEN VIVERES', pageWidth / 2, 24, { align: 'center' });

            // --- Metadata ---
            doc.setFontSize(9);
            const metaY1 = 33;
            doc.setFont('helvetica', 'bold');
            doc.text('Partida Presupuestal:', margin + 45, metaY1, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.text(partida, margin + 47, metaY1);
            doc.line(margin + 46, metaY1 + 1, margin + 65, metaY1 + 1);

            doc.setFont('helvetica', 'bold');
            doc.text('Unidad Hospitalaria:', margin + 140, metaY1, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.text(unidad, margin + 142, metaY1);
            doc.line(margin + 141, metaY1 + 1, margin + 190, metaY1 + 1);
            
            const metaY2 = 40;
            const displayDate = new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
            doc.setFont('helvetica', 'bold');
            doc.text('FECHA:', margin, metaY2);
            doc.setFont('helvetica', 'normal');
            doc.text(displayDate, margin + 14, metaY2);
            doc.line(margin + 13, metaY2 + 1, margin + 40, metaY2 + 1);

            doc.setFont('helvetica', 'bold');
            doc.text('SERVICIO:', margin + 70, metaY2);
            doc.setFont('helvetica', 'normal');
            doc.text(servicio, margin + 88, metaY2);
            doc.line(margin + 87, metaY2 + 1, margin + 145, metaY2 + 1);
            
            doc.setFont('helvetica', 'bold');
            doc.text('CUENTA:', margin + 180, metaY2);
            doc.setFont('helvetica', 'normal');
            doc.text(cuenta, margin + 197, metaY2);
            doc.line(margin + 196, metaY2 + 1, margin + 220, metaY2 + 1);

            // --- Main Table ---
            const tableColumn = [
                ["CODIGO", "DESCRIPCION DEL ARTICULO", "UNIDAD", 
                {content: 'CANTIDAD\nPEDIDA', styles: {halign: 'center'}}, 
                {content: 'CANTIDAD\nSURTIDA', styles: {halign: 'center'}}, 
                "CANTIDAD SURTIDA CON LETRA/\nOBSERVACIONES"]
            ];
            
            const tableRows = items.map(item => {
                const cantidad = Number(item.cantidadPedida);
                const cantidadValida = !isNaN(cantidad) && cantidad > 0;
                const cantidadSurtidaLetra = cantidadValida ? convertirNumeroALetras(cantidad) : '';

                return [
                    item.codigo,
                    item.descripcion,
                    item.unidad,
                    {content: item.cantidadPedida, styles: {halign: 'center'}},
                    {content: cantidadValida ? item.cantidadPedida : '', styles: {halign: 'center'}},
                    cantidadSurtidaLetra
                ];
            });

            const totalRowsOnForm = 16;
            while(tableRows.length < totalRowsOnForm){
                tableRows.push(["", "", "", "", "", ""]);
            }

            doc.autoTable({
                head: tableColumn,
                body: tableRows.slice(0, totalRowsOnForm),
                startY: 45,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 0.8,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    valign: 'middle',
                    minCellHeight: 7.0,
                    textColor: [0, 0, 0]
                },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    fontSize: 7.5,
                    cellPadding: 0.5,
                },
                 columnStyles: {
                    0: { cellWidth: 22 },
                    1: { cellWidth: 88 },
                    2: { cellWidth: 15, halign: 'center' },
                    3: { cellWidth: 18, halign: 'center' },
                    4: { cellWidth: 18, halign: 'center' },
                    5: { cellWidth: 'auto' },
                },
                margin: { left: margin, right: margin },
            });
            
            // --- Signature Table ---
            const entregadoPor = personalEntrega.find(p => p.id === entregadoPorId);
            const recibidoPor = personalRecibe.find(p => p.id === recibidoPorId);

            doc.autoTable({
                startY: (doc as any).autoTable.previous.finalY + 3,
                body: [
                    ['JEFE DE SERVICIO DIETOLOGÍA', 'ALMACÉN DE VÍVERES', 'ENTREGADO POR', 'RECIBIDO POR'],
                    [
                        'KARLA MABEL GUTIÉRREZ VELASCO\nRUD: 980395', 
                        'OSCAR BECERRA GONZÁLEZ\nRUD: 980933', 
                        entregadoPor ? `${entregadoPor.nombre}\nRUD: ${entregadoPor.rud}` : '', 
                        recibidoPor ? `${recibidoPor.nombre}\nRUD: ${recibidoPor.rud}` : ''
                    ],
                    ['NOMBRE Y FIRMA', 'NOMBRE Y FIRMA', 'NOMBRE Y RUD', 'NOMBRE Y RUD']
                ],
                theme: 'grid',
                styles: {
                    font: 'helvetica',
                    fontSize: 7,
                    halign: 'center',
                    valign: 'middle',
                    lineColor: [0, 0, 0],
                    lineWidth: 0.2,
                    cellPadding: 0.8,
                    textColor: [0, 0, 0]
                },
                didParseCell: (hookData: any) => {
                    if (hookData.row.index === 0 || hookData.row.index === 2) {
                         hookData.cell.styles.fontStyle = 'bold';
                         hookData.cell.styles.fontSize = 7.5;
                    }
                     if (hookData.row.index === 1) { 
                        hookData.cell.styles.minCellHeight = 14;
                        hookData.cell.styles.fontSize = 7;
                        hookData.cell.styles.valign = 'middle';
                    }
                },
                margin: { left: margin, right: margin },
            });

            doc.output('dataurlnewwindow');

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
        } finally {
            setIsLoading(false);
        }
    }, [partida, unidad, fecha, servicio, cuenta, items, entregadoPorId, recibidoPorId]);

    const isPdfButtonDisabled = isLoading || items.length === 0 || items.every(item => !item.descripcion || item.descripcion === "Seleccione un artículo...");
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-sans">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl shadow-slate-900/10 p-6 sm:p-8 max-w-6xl mx-auto">
                <Header 
                    isLoading={isLoading}
                    isPdfButtonDisabled={isPdfButtonDisabled}
                    onGeneratePdf={generatePdf}
                />
                <main>
                    <MetadataForm 
                        fecha={fecha}
                        servicio={servicio}
                        onFechaChange={setFecha}
                        onServicioChange={setServicio}
                    />
                    <ItemList
                        items={items}
                        articulos={articulos}
                        expandedItemId={expandedItemId}
                        setExpandedItemId={setExpandedItemId}
                        onItemChange={handleItemChange}
                        onArticleChange={handleArticleChange}
                        onAddItem={addItem}
                        onDeleteItem={deleteItem}
                    />
                    <SignatureFields 
                        entregadoPorId={entregadoPorId}
                        recibidoPorId={recibidoPorId}
                        onEntregadoChange={setEntregadoPorId}
                        onRecibidoChange={setRecibidoPorId}
                    />
                </main>
            </div>
        </div>
    );
};

export default App;