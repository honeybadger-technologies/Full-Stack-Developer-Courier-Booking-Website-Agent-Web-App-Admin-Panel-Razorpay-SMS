import { getSupabaseClient } from '@courier/supabase-client';
import type { Booking, Parcel, Customer } from '@courier/models';

// Print types
export type DocumentType = 'sticker' | 'cn22' | 'cn23' | 'invoice';

export interface PrintOptions {
  documentType: DocumentType;
  data: Record<string, unknown>;
  outputPath?: string;
}

/**
 * Generate a simple sticker HTML for printing
 */
export async function generateStickerHTML(booking: Booking, customer: Customer): Promise<string> {
  const qrCode = generateQRCode(booking.booking_reference);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Shipping Sticker</title>
      <style>
        @media print {
          body { margin: 0; padding: 10px; }
          .sticker { border: 2px solid #0066cc; padding: 15px; border-radius: 4px; width: 105mm; min-height: 148mm; }
          h1 { margin: 0 0 10px 0; font-size: 16px; color: #0066cc; text-align: center; }
          h2 { margin: 10px 0 5px 0; font-size: 12px; font-weight: bold; }
          p { margin: 3px 0; font-size: 11px; }
          .qr { text-align: center; margin-top: 15px; font-family: monospace; font-size: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="sticker">
        <h1>HONEYBADGER COURIER</h1>
        <h2>INTERNATIONAL PARCEL</h2>
        <p>Booking: ${booking.booking_reference}</p>
        <h2>RECEIVER ADDRESS</h2>
        <p>${customer.name}</p>
        <p>${JSON.parse(booking.pickup_address as unknown as string).address}</p>
        <p>${JSON.parse(booking.pickup_address as unknown as string).city} - ${JSON.parse(booking.pickup_address as unknown as string).pincode}</p>
        <h2>PACKAGE INFORMATION</h2>
        <p>Weight: ${booking.total_weight_kg} kg</p>
        <p>Value: ₹${booking.total_price}</p>
        <div class="qr">${qrCode}</div>
        <div class="qr">Scan at pickup</div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
}

/**
 * Generate a simple HTML invoice
 */
export async function generateInvoiceHTML(
  booking: Booking,
  parcels: Parcel[],
  customer: Customer
): Promise<string> {
  const totalAmount = parcels.reduce((sum, p) => sum + p.value_inr, 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .invoice { max-width: 210mm; margin: 0 auto; }
          h1 { text-align: center; color: #0066cc; }
          .section { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .total { font-weight: bold; font-size: 14px; }
        }
      </style>
    </head>
    <body>
      <div class="invoice">
        <h1>INVOICE</h1>
        <p>HONEYBADGER COURIER SERVICES</p>

        <div class="section">
          <p><strong>Invoice:</strong> ${booking.booking_reference}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <h3>Customer</h3>
          <p>${customer.name}</p>
          <p>${customer.phone}</p>
        </div>

        <div class="section">
          <h3>Items</h3>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Weight</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${parcels.map(p => `
                <tr>
                  <td>${p.description}</td>
                  <td>${p.weight_kg} kg</td>
                  <td>₹${p.value_inr}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="total" style="text-align: right; margin-top: 10px;">
            Total: ₹${totalAmount}
          </p>
        </div>

        <div class="section">
          <h3>Payment Status</h3>
          <p>Status: Paid</p>
          <p>Amount: ₹${booking.total_price}</p>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
}

/**
 * Print sticker to browser
 */
export async function printStickerToBrowser(booking: Booking, customer: Customer): Promise<void> {
  const html = await generateStickerHTML(booking, customer);

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Generate QR code data
 */
function generateQRCode(bookingReference: string): string {
  // In production, this would use a QR library to generate the QR data
  return `HB-CUR-${bookingReference}`;
}

/**
 * Save document to Supabase Storage
 */
export async function saveDocumentToStorage(
  content: string,
  bookingId: string,
  documentType: DocumentType,
  contentType: string = 'text/html'
): Promise<string> {
  const supabase = getSupabaseClient();

  const fileName = `${bookingId}-${documentType}-${Date.now()}.${contentType === 'text/html' ? 'html' : 'pdf'}`;
  const filePath = `documents/${bookingId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, new Blob([content], { type: contentType }), {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload document: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL');
  }

  return urlData.publicUrl;
}