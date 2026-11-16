import pdfMake from 'pdfmake';
import html2canvas from 'html2canvas';
import { getSupabaseClient } from '@courier/supabase-client';
import type { Booking, Parcel, Customer } from '@courier/models';

// Print types
export type DocumentType = 'sticker' | 'cn22' | 'cn23' | 'invoice';

export interface PrintOptions {
  documentType: DocumentType;
  data: Record<string, unknown>;
  outputPath?: string;
}

// Sticker dimensions (A6 size: 105mm x 148mm)
const STICKER_WIDTH = 105;
const STICKER_HEIGHT = 148;
const DPI = 300;

/**
 * Generate a sticker PDF for a booking
 */
export async function generateStickerPDF(booking: Booking, customer: Customer): Promise<Buffer> {
  const qrCode = generateQRCode(booking.booking_reference);

  const docDefinition = {
    pageSize: {
      width: STICKER_WIDTH,
      height: STICKER_HEIGHT,
    },
    pageMargins: [5, 5, 5, 5],
    content: [
      // Header with logo placeholder
      {
        text: 'HONEYBADGER COURIER',
        style: 'header',
        alignment: 'center',
      },
      {
        text: 'INTERNATIONAL PARCEL',
        style: 'subheader',
        alignment: 'center',
      },
      {
        text: ' ',
        margin: [0, 5, 0, 0],
      },
      // Booking reference
      {
        text: `Booking: ${booking.booking_reference}`,
        style: 'reference',
        alignment: 'center',
      },
      {
        text: ' ',
        margin: [0, 5, 0, 0],
      },
      // Receiver address
      {
        text: 'RECEIVER ADDRESS',
        style: 'addressLabel',
      },
      {
        text: customer.name,
        style: 'addressLine',
      },
      {
        text: JSON.parse(booking.pickup_address as unknown as string).address,
        style: 'addressLine',
      },
      {
        text: JSON.parse(booking.pickup_address as unknown as string).city,
        style: 'addressLine',
      },
      {
        text: JSON.parse(booking.pickup_address as unknown as string).pincode,
        style: 'addressLine',
      },
      {
        text: ' ',
        margin: [0, 5, 0, 0],
      },
      // Package info
      {
        text: 'PACKAGE INFORMATION',
        style: 'addressLabel',
      },
      {
        text: `Weight: ${booking.total_weight_kg} kg`,
        style: 'packageInfo',
      },
      {
        text: `Value: ₹${booking.total_price}`,
        style: 'packageInfo',
      },
      // QR Code
      {
        qr: qrCode,
        fit: 50,
        alignment: 'center',
        margin: [0, 5, 0, 5],
      },
      {
        text: 'Scan at pickup',
        style: 'qrLabel',
        alignment: 'center',
      },
      {
        text: ' ',
        margin: [0, 10, 0, 0],
      },
      // Footer
      {
        text: 'www.honeybadger.courier | +91 XXXXXXXXXX',
        style: 'footer',
        alignment: 'center',
      },
    ],
    styles: {
      header: {
        fontSize: 10,
        bold: true,
        margin: [0, 5, 0, 0],
      },
      subheader: {
        fontSize: 8,
        italics: true,
        margin: [0, 0, 0, 5],
      },
      reference: {
        fontSize: 12,
        bold: true,
        margin: [0, 5, 0, 10],
      },
      addressLabel: {
        fontSize: 9,
        bold: true,
        margin: [0, 5, 0, 2],
      },
      addressLine: {
        fontSize: 8,
        margin: [0, 0, 0, 1],
      },
      packageInfo: {
        fontSize: 8,
        margin: [0, 0, 0, 1],
      },
      qrLabel: {
        fontSize: 7,
        italics: true,
        margin: [0, 2, 0, 5],
      },
      footer: {
        fontSize: 7,
        color: '#666',
        margin: [0, 5, 0, 0],
      },
    },
  };

  const pdfBuffer = pdfMake.createPdf(docDefinition).getBuffer();
  return pdfBuffer as Buffer;
}

/**
 * Generate a CN22 customs form (for parcels ≤1kg)
 */
export async function generateCN22PDF(
  booking: Booking,
  parcels: Parcel[],
  customer: Customer
): Promise<Buffer> {
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20],
    content: [
      {
        text: 'CUSTOMS DECLARATION FORM (CN22)',
        style: 'title',
        alignment: 'center',
      },
      {
        text: 'For parcels containing goods with a value of £900 or less',
        style: 'subtitle',
        alignment: 'center',
      },
      {
        text: ' ',
        margin: [0, 10, 0, 0],
      },
      // Sender information
      {
        text: 'SENDER INFORMATION',
        style: 'sectionTitle',
      },
      {
        text: `Name: ${customer.name}`,
        style: 'infoLine',
      },
      {
        text: `Address: ${JSON.parse(booking.pickup_address as unknown as string).address}`,
        style: 'infoLine',
      },
      {
        text: `City: ${JSON.parse(booking.pickup_address as unknown as string).city}`,
        style: 'infoLine',
      },
      {
        text: `Pincode: ${JSON.parse(booking.pickup_address as unknown as string).pincode}`,
        style: 'infoLine',
      },
      {
        text: `Phone: ${customer.phone}`,
        style: 'infoLine',
      },
      {
        text: ' ',
        margin: [0, 5, 0, 0],
      },
      // Receiver information
      {
        text: 'RECIPIENT INFORMATION',
        style: 'sectionTitle',
      },
      {
        text: 'Name: [To be filled at destination]',
        style: 'infoLine',
      },
      {
        text: 'Address: [To be filled at destination]',
        style: 'infoLine',
      },
      {
        text: ' ',
        margin: [0, 5, 0, 0],
      },
      // Items description
      {
        text: 'ITEMS IN THIS PACKAGE',
        style: 'sectionTitle',
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '30', '30', '30', '*'],
          body: [
            ['Description', 'Qty', 'Value (INR)', 'Weight (kg)', 'HS Code'],
            ...parcels.map((p) => [
              p.description,
              '1',
              p.value_inr.toString(),
              p.weight_kg.toString(),
              '999999',
            ]),
          ],
        },
        layout: 'lightLines',
      },
      {
        text: ' ',
        margin: [0, 5, 0, 0],
      },
      // Total value
      {
        text: `Total Value (INR): ₹${parcels.reduce((sum, p) => sum + p.value_inr, 0)}`,
        style: 'totalValue',
      },
      {
        text: ' ',
        margin: [0, 20, 0, 0],
      },
      // Declaration
      {
        text: 'DECLARATION',
        style: 'sectionTitle',
      },
      {
        text: 'I certify that the contents of this parcel are correctly described above, that they are not prohibited for import into the destination country, and that the value is accurate.',
        style: 'declaration',
      },
      {
        text: `Signature: ${customer.name}`,
        style: 'signature',
        margin: [0, 20, 0, 0],
      },
      {
        text: `Date: ${new Date().toLocaleDateString()}`,
        style: 'signature',
      },
    ],
    styles: {
      title: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      subtitle: {
        fontSize: 10,
        italics: true,
        margin: [0, 0, 0, 20],
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      infoLine: {
        fontSize: 10,
        margin: [0, 2, 0, 0],
      },
      declaration: {
        fontSize: 9,
        italics: true,
        margin: [0, 5, 0, 5],
      },
      signature: {
        fontSize: 10,
        margin: [0, 2, 0, 2],
      },
      totalValue: {
        fontSize: 11,
        bold: true,
        alignment: 'right',
        margin: [0, 5, 0, 0],
      },
    },
  };

  const pdfBuffer = pdfMake.createPdf(docDefinition).getBuffer();
  return pdfBuffer as Buffer;
}

/**
 * Generate a CN23 customs form (for parcels >1kg)
 */
export async function generateCN23PDF(
  booking: Booking,
  parcels: Parcel[],
  customer: Customer
): Promise<Buffer> {
  // CN23 is similar to CN22 but with additional fields
  // For simplicity, we use a larger format
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20],
    content: [
      {
        text: 'CUSTOMS DECLARATION FORM (CN23)',
        style: 'title',
        alignment: 'center',
      },
      {
        text: 'For parcels containing goods with a value exceeding £900',
        style: 'subtitle',
        alignment: 'center',
      },
      {
        text: ' ',
        margin: [0, 10, 0, 0],
      },
      // Sender information
      {
        text: 'SENDER INFORMATION',
        style: 'sectionTitle',
      },
      {
        text: `Name: ${customer.name}`,
        style: 'infoLine',
      },
      {
        text: `Address: ${JSON.parse(booking.pickup_address as unknown as string).address}`,
        style: 'infoLine',
      },
      {
        text: `City: ${JSON.parse(booking.pickup_address as unknown as string).city}`,
        style: 'infoLine',
      },
      {
        text: `State: ${JSON.parse(booking.pickup_address as unknown as string).state}`,
        style: 'infoLine',
      },
      {
        text: `Pincode: ${JSON.parse(booking.pickup_address as unknown as string).pincode}`,
        style: 'infoLine',
      },
      {
        text: `Phone: ${customer.phone}`,
        style: 'infoLine',
      },
      {
        text: `Email: ${customer.email || 'N/A'}`,
        style: 'infoLine',
      },
      {
        text: ' ',
        margin: [0, 5, 0, 0],
      },
      // Receiver information
      {
        text: 'RECIPIENT INFORMATION',
        style: 'sectionTitle',
      },
      {
        text: 'Name: [To be filled at destination]',
        style: 'infoLine',
      },
      {
        text: 'Address: [To be filled at destination]',
        style: 'infoLine',
      },
      {
        text: ' ',
        margin: [0, 5, 0, 0],
      },
      // Items description (detailed)
      {
        text: 'ITEMS IN THIS PACKAGE',
        style: 'sectionTitle',
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '25', '25', '25', '25', '25', '*'],
          body: [
            [
              'Description',
              'Qty',
              'Value (INR)',
              'Value (USD)',
              'Weight (kg)',
              'Origin',
              'HS Code',
            ],
            ...parcels.map((p) => [
              p.description,
              '1',
              p.value_inr.toString(),
              (p.value_inr / 83).toFixed(2), // Approximate USD conversion
              p.weight_kg.toString(),
              'India',
              '999999',
            ]),
          ],
        },
        layout: 'lightLines',
      },
      {
        text: ' ',
        margin: [0, 5, 0, 0],
      },
      // Total value
      {
        text: `Total Value (INR): ₹${parcels.reduce((sum, p) => sum + p.value_inr, 0)}`,
        style: 'totalValue',
      },
      {
        text: `Total Weight: ${parcels.reduce((sum, p) => sum + p.weight_kg, 0)} kg`,
        style: 'totalValue',
      },
      {
        text: ' ',
        margin: [0, 20, 0, 0],
      },
      // Declaration
      {
        text: 'DECLARATION',
        style: 'sectionTitle',
      },
      {
        text: 'I certify that the contents of this parcel are correctly described above, that they are not prohibited for import into the destination country, and that the value is accurate.',
        style: 'declaration',
      },
      {
        text: `Signature: ${customer.name}`,
        style: 'signature',
        margin: [0, 20, 0, 0],
      },
      {
        text: `Date: ${new Date().toLocaleDateString()}`,
        style: 'signature',
      },
    ],
    styles: {
      title: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      subtitle: {
        fontSize: 10,
        italics: true,
        margin: [0, 0, 0, 20],
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      infoLine: {
        fontSize: 10,
        margin: [0, 2, 0, 0],
      },
      declaration: {
        fontSize: 9,
        italics: true,
        margin: [0, 5, 0, 5],
      },
      signature: {
        fontSize: 10,
        margin: [0, 2, 0, 2],
      },
      totalValue: {
        fontSize: 11,
        bold: true,
        margin: [0, 5, 0, 0],
      },
    },
  };

  const pdfBuffer = pdfMake.createPdf(docDefinition).getBuffer();
  return pdfBuffer as Buffer;
}

/**
 * Generate an invoice PDF
 */
export async function generateInvoicePDF(
  booking: Booking,
  parcels: Parcel[],
  customer: Customer
): Promise<Buffer> {
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      // Header
      {
        text: 'INVOICE',
        style: 'title',
        alignment: 'center',
      },
      {
        text: 'HONEYBADGER COURIER SERVICES',
        style: 'companyName',
        alignment: 'center',
      },
      {
        text: ' ',
        margin: [0, 10, 0, 0],
      },
      // Invoice info
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              {
                text: `Invoice #: ${booking.booking_reference}`,
                style: 'infoBoxLabel',
              },
              {
                text: `Date: ${new Date().toLocaleDateString()}`,
                style: 'infoBoxLabel',
              },
            ],
            [
              {
                text: `Customer: ${customer.name}`,
                style: 'infoBoxValue',
              },
              {
                text: `Phone: ${customer.phone}`,
                style: 'infoBoxValue',
              },
            ],
          ],
        },
        layout: 'noBorders',
      },
      {
        text: ' ',
        margin: [0, 20, 0, 0],
      },
      // Items table
      {
        table: {
          headerRows: 1,
          widths: ['*', '30', '30', '30', '30'],
          body: [
            [
              'Description',
              'Weight (kg)',
              'Length (cm)',
              'Width (cm)',
              'Amount (₹)',
            ],
            ...parcels.map((p) => [
              p.description,
              p.weight_kg.toString(),
              p.length_cm.toString(),
              p.width_cm.toString(),
              p.value_inr.toFixed(2),
            ]),
            [
              { text: 'Total', colSpan: 4, style: 'tableTotalLabel' },
              {},
              {},
              {},
              booking.total_price.toFixed(2),
            ],
          ],
        },
        layout: 'lightLines',
      },
      {
        text: ' ',
        margin: [0, 20, 0, 0],
      },
      // Summary
      {
        text: 'SUMMARY',
        style: 'sectionTitle',
      },
      {
        text: `Subtotal: ₹${booking.total_price.toFixed(2)}`,
        style: 'summaryLine',
      },
      {
        text: `Tax (IGST): ₹0.00`,
        style: 'summaryLine',
      },
      {
        text: `Total: ₹${booking.total_price.toFixed(2)}`,
        style: 'summaryTotal',
      },
      {
        text: ' ',
        margin: [0, 20, 0, 0],
      },
      // Payment info
      {
        text: 'PAYMENT INFORMATION',
        style: 'sectionTitle',
      },
      {
        text: 'Payment Status: Paid',
        style: 'infoLine',
      },
      {
        text: 'Payment Method: Razorpay',
        style: 'infoLine',
      },
      {
        text: `Razorpay Payment ID: ${booking.booking_reference}`,
        style: 'infoLine',
      },
      {
        text: ' ',
        margin: [0, 20, 0, 0],
      },
      // Footer
      {
        text: 'Thank you for choosing Honeybadger Courier Services!',
        style: 'footer',
        alignment: 'center',
      },
      {
        text: 'Contact: +91 XXXXXXXXXX | support@honeybadger.courier',
        style: 'footer',
        alignment: 'center',
      },
    ],
    styles: {
      title: {
        fontSize: 24,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      companyName: {
        fontSize: 14,
        italics: true,
        margin: [0, 0, 0, 20],
      },
      infoBoxLabel: {
        fontSize: 10,
        bold: true,
        margin: [0, 0, 0, 2],
      },
      infoBoxValue: {
        fontSize: 10,
        margin: [0, 0, 0, 2],
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      tableTotalLabel: {
        fontSize: 10,
        bold: true,
        margin: [0, 5, 0, 5],
      },
      summaryLine: {
        fontSize: 11,
        margin: [0, 2, 0, 2],
      },
      summaryTotal: {
        fontSize: 12,
        bold: true,
        margin: [0, 5, 0, 5],
      },
      infoLine: {
        fontSize: 10,
        margin: [0, 2, 0, 2],
      },
      footer: {
        fontSize: 9,
        color: '#666',
        margin: [0, 5, 0, 0],
      },
    },
  };

  const pdfBuffer = pdfMake.createPdf(docDefinition).getBuffer();
  return pdfBuffer as Buffer;
}

/**
 * Generate QR code data for the sticker
 */
function generateQRCode(bookingReference: string): string {
  // In production, this would use a QR library to generate the QR data
  // For now, we return a mock QR data string
  return `HB-CUR-${bookingReference}`;
}

/**
 * Save PDF to Supabase Storage
 */
export async function savePDFToStorage(
  pdfBuffer: Buffer,
  bookingId: string,
  documentType: DocumentType
): Promise<string> {
  const supabase = getSupabaseClient();

  const fileName = `${bookingId}-${documentType}-${Date.now()}.pdf`;
  const filePath = `documents/${bookingId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }

  // Get the public URL
  const { data: urlData, error: urlError } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  if (urlError) {
    throw new Error(`Failed to get public URL: ${urlError.message}`);
  }

  return urlData.publicUrl;
}

/**
 * Print sticker to a connected printer (browser print dialog)
 */
export async function printStickerToBrowser(booking: Booking, customer: Customer): Promise<void> {
  const pdfBuffer = await generateStickerPDF(booking, customer);

  // Create a blob from the PDF
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  // Open in new window for printing
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}