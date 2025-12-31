
// src/api/escposService.js
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ESC = '\x1B';
const GS = '\x1D';
const NUL = '\x00';

const COMMANDS = {
  // Feed control
  CTL_LF: '\n',
  CTL_FF: '\f',
  CTL_CR: '\r',
  CTL_HT: '\t',
  CTL_VT: '\v',

  // Paper cutting
  PAPER_FULL_CUT: `${ESC}@${GS}V\x01`,
  PAPER_PART_CUT: `${ESC}@${GS}V\x00`,

  // Text formatting
  TXT_NORMAL: `${ESC}!\x00`,
  TXT_2HEIGHT: `${ESC}!\x10`,
  TXT_2WIDTH: `${ESC}!\x20`,
  TXT_4SQUARE: `${ESC}!\x30`,
  TXT_BOLD_ON: `${ESC}E\x01`,
  TXT_BOLD_OFF: `${ESC}E\x00`,
  TXT_ALIGN_LT: `${ESC}a\x00`,
  TXT_ALIGN_CT: `${ESC}a\x01`,
  TXT_ALIGN_RT: `${ESC}a\x02`,

  // Cash Drawer
  CD_KICK_2: `${ESC}p\x00`, // Sends a pulse to pin 2
  CD_KICK_5: `${ESC}p\x01`, // Sends a pulse to pin 5

  // Initialization
  HW_INIT: `${ESC}@`,
};

class EscPosService {
  constructor() {
    this.device = null;
    this.endpoint = null;
    this.encoder = new TextEncoder();
  }

  async connect() {
    try {
      console.log("Requesting USB device...");
      this.device = await navigator.usb.requestDevice({
        filters: [
          // Adicione aqui os Vendor IDs e Product IDs da sua impressora
          // Exemplos comuns:
          // { vendorId: 0x04b8, productId: 0x0202 }, // Epson TM-T20
          // { vendorId: 0x1504, productId: 0x0006 }, // Bixolon
        ],
      });

      if (!this.device) {
        console.error("Nenhuma impressora selecionada.");
        return false;
      }

      console.log("Device selected:", this.device);

      await this.device.open();
      console.log("Device opened.");

      // A configuração pode variar. Tente a primeira (configuration 1).
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
        console.log("Configuration selected.");
      }

      // A interface também pode variar. Tente a primeira (interface 0).
      await this.device.claimInterface(0);
      console.log("Interface claimed.");

      // Encontrar o endpoint de saída (OUT)
      this.endpoint = this.device.configuration.interfaces[0].alternate.endpoints.find(
        (ep) => ep.direction === 'out'
      );

      if (!this.endpoint) {
        throw new Error("Endpoint de impressão não encontrado.");
      }
      
      console.log("Printer connected successfully!", this.endpoint);
      return true;

    } catch (error) {
      console.error("Erro ao conectar com a impressora USB:", error);
      this.device = null;
      this.endpoint = null;
      return false;
    }
  }

  async disconnect() {
    if (!this.device) return;
    try {
      await this.device.releaseInterface(0);
      await this.device.close();
      console.log("Printer disconnected.");
    } catch (error) {
      console.error("Erro ao desconectar a impressora:", error);
    } finally {
      this.device = null;
      this.endpoint = null;
    }
  }

  async write(data) {
    if (!this.device || !this.endpoint) {
      throw new Error("Impressora não está conectada.");
    }
    const encodedData = this.encoder.encode(data);
    await this.device.transferOut(this.endpoint.endpointNumber, encodedData);
  }
  
  // Funções de conveniência
  async init() {
    await this.write(COMMANDS.HW_INIT);
  }

  async cut() {
    await this.write(COMMANDS.PAPER_PART_CUT);
  }
  
  async openCashDrawer() {
    await this.write(COMMANDS.CD_KICK_2);
  }

  async printReceipt(sale, settings) {
    if (!this.device) {
      throw new Error("Impressora não conectada. Conecte primeiro.");
    }

    const width = settings?.printer_width === 80 ? 48 : 32;

    const center = (text) => text.padStart((width + text.length) / 2, ' ').padEnd(width, ' ');
    const align = (left, right) => left + right.padStart(width - left.length, ' ');

    await this.init();

    // Cabeçalho
    await this.write(COMMANDS.TXT_ALIGN_CT);
    if (settings?.store_name) {
      await this.write(COMMANDS.TXT_BOLD_ON + COMMANDS.TXT_2HEIGHT + settings.store_name + '\n');
      await this.write(COMMANDS.TXT_NORMAL);
    }
    if (settings?.address) await this.write(settings.address + '\n');
    if (settings?.phone) await this.write(settings.phone + '\n');
    if (settings?.cnpj) await this.write(`CNPJ: ${settings.cnpj}\n`);
    await this.write('--------------------------------\n');
    await this.write(align(`Venda: #${sale.sale_number}`, `Data: ${format(new Date(sale.created_date), 'dd/MM/yy HH:mm')}`)+'\n');
    await this.write('--------------------------------\n');

    // Itens
    await this.write(COMMANDS.TXT_ALIGN_LT);
    sale.items.forEach(item => {
      const itemLine = align(`${item.quantity}x ${item.product_name}`, `R$ ${item.total.toFixed(2)}`);
      this.write(itemLine + '\n');
    });

    // Totais
    await this.write('--------------------------------\n');
    await this.write(COMMANDS.TXT_ALIGN_RT);
    await this.write(align('Subtotal:', `R$ ${sale.subtotal.toFixed(2)}`)+'\n');
    if (sale.discount > 0) {
      await this.write(align('Desconto:', `- R$ ${sale.discount.toFixed(2)}`)+'\n');
    }
    await this.write(COMMANDS.TXT_BOLD_ON);
    await this.write(align('TOTAL:', `R$ ${sale.total.toFixed(2)}`)+'\n');
    await this.write(COMMANDS.TXT_BOLD_OFF);
    await this.write(align(`Pago (${sale.payment_method}):`, `R$ ${sale.amount_paid.toFixed(2)}`)+'\n');
    if (sale.change > 0) {
      await this.write(align('Troco:', `R$ ${sale.change.toFixed(2)}`)+'\n');
    }

    // Rodapé
    await this.write('\n');
    await this.write(COMMANDS.TXT_ALIGN_CT);
    await this.write('Obrigado pela preferência!\n');
    await this.write('Volte sempre.\n\n\n');

    // Cortar papel
    await this.cut();
  }
}

export const escposService = new EscPosService();
