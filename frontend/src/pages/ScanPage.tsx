import { motion } from "framer-motion";
import { ScanLine, Keyboard, ArrowRight, Camera, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface ParsedUpiPayload {
  pa: string;
  pn?: string;
  tn?: string;
  am?: string;
  cu?: string;
}

interface PendingPayment {
  tr: string;
  name: string;
  amount: number;
  createdAt: string;
}

const PENDING_PAYMENT_KEY = "smart-spend-pending-upi-payment";

const parseUpiPayload = (raw: string): ParsedUpiPayload | null => {
  const upiStart = raw.indexOf("upi://pay");
  if (upiStart === -1) return null;

  const upiUri = raw.slice(upiStart).trim();
  const queryIndex = upiUri.indexOf("?");
  if (queryIndex === -1) return null;

  const params = new URLSearchParams(upiUri.slice(queryIndex + 1));
  const pa = params.get("pa")?.trim();
  if (!pa) return null;

  return {
    pa,
    pn: params.get("pn")?.trim() || undefined,
    tn: params.get("tn")?.trim() || undefined,
    am: params.get("am")?.trim() || undefined,
    cu: params.get("cu")?.trim() || "INR",
  };
};

const clearPendingPayment = () => localStorage.removeItem(PENDING_PAYMENT_KEY);

const getPendingPayment = (): PendingPayment | null => {
  const raw = localStorage.getItem(PENDING_PAYMENT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingPayment;
  } catch {
    clearPendingPayment();
    return null;
  }
};

const ScanPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);

  const [showManual, setShowManual] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [upiPayload, setUpiPayload] = useState<ParsedUpiPayload | null>(null);
  const [scanMessage, setScanMessage] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const addTransactionMutation = useMutation({
    mutationFn: (payload: { name: string; amount: number }) =>
      api.createTransaction({
        name: payload.name,
        amount: -Math.abs(payload.amount),
        source: "scan",
      }),
    onSuccess: async () => {
      setAmount("");
      setDescription("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["rewards"] }),
      ]);
    },
  });

  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      if (scanningRef.current) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.clear();
    } catch {
      // ignore scanner cleanup errors
    } finally {
      scannerRef.current = null;
      scanningRef.current = false;
      setIsCameraOpen(false);
      setIsStartingCamera(false);
    }
  };

  const startScanner = async () => {
    if (isStartingCamera || isCameraOpen) return;

    setIsStartingCamera(true);
    setScanMessage("");

    try {
      const scanner = new Html5Qrcode("upi-qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        async (decodedText) => {
          const parsed = parseUpiPayload(decodedText);
          if (!parsed) {
            setScanMessage("Scanned QR is not a valid UPI QR.");
            return;
          }

          setUpiPayload(parsed);
          if (parsed.am && !Number.isNaN(Number(parsed.am))) {
            setAmount(parsed.am);
          }

          if (parsed.tn) {
            setDescription(parsed.tn);
          } else if (parsed.pn && !description.trim()) {
            setDescription(`Payment to ${parsed.pn}`);
          }

          setScanMessage("UPI QR scanned successfully.");
          await stopScanner();
        },
        () => {
          // ignore frame-level decode errors
        },
      );

      scanningRef.current = true;
      setIsCameraOpen(true);
      setShowManual(true);
    } catch {
      setScanMessage("Could not open camera. Please allow camera permission.");
      await stopScanner();
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusRaw =
      params.get("Status") ||
      params.get("status") ||
      params.get("txnStatus") ||
      params.get("txnstatus") ||
      "";

    if (!statusRaw) return;

    const status = statusRaw.toLowerCase();
    const pending = getPendingPayment();
    if (!pending) {
      navigate("/scan", { replace: true });
      return;
    }

    if (status.includes("success") || status.includes("submitted")) {
      addTransactionMutation.mutate(
        {
          name: pending.name,
          amount: pending.amount,
        },
        {
          onSuccess: () => {
            clearPendingPayment();
            setScanMessage("Payment successful. Transaction added.");
            navigate("/scan", { replace: true });
          },
          onError: () => {
            setScanMessage("Payment was successful but transaction could not be saved. Please retry.");
          },
        },
      );
      return;
    }

    clearPendingPayment();
    setScanMessage("Payment failed or cancelled. Transaction not added.");
    navigate("/scan", { replace: true });
  }, [location.search, navigate]);

  const canPay = useMemo(() => {
    const parsedAmount = Number(amount);
    return !!upiPayload?.pa && !!description.trim() && !Number.isNaN(parsedAmount) && parsedAmount > 0;
  }, [upiPayload, amount, description]);

  const handlePay = () => {
    if (!upiPayload?.pa) {
      setScanMessage("Please scan a valid UPI QR first.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setScanMessage("Please enter a valid amount and description.");
      return;
    }

    const tr = `${Date.now()}`;
    const callbackUrl = `${window.location.origin}/scan?tr=${tr}`;
    const params = new URLSearchParams();
    params.set("pa", upiPayload.pa);
    params.set("pn", upiPayload.pn || "UPI Payee");
    params.set("tn", description.trim());
    params.set("tr", tr);
    params.set("am", parsedAmount.toFixed(2));
    params.set("cu", upiPayload.cu || "INR");
    params.set("url", callbackUrl);

    const pending: PendingPayment = {
      tr,
      name: description.trim(),
      amount: parsedAmount,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pending));

    window.location.href = `upi://pay?${params.toString()}`;
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold mb-1">Scan & Pay</h1>
        <p className="text-sm text-muted-foreground mb-6">Scan a QR code to pay and earn coins</p>
      </motion.div>

      {/* QR Scanner Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative aspect-square max-w-[300px] mx-auto mb-8 rounded-3xl border-2 border-dashed border-primary/40 bg-gradient-card flex flex-col items-center justify-center gap-4 overflow-hidden"
      >
        {/* Corner markers */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />

        {/* Scanning line animation */}
        <motion.div
          className="absolute left-6 right-6 h-0.5 bg-gradient-primary rounded-full opacity-60"
          animate={{ top: ["15%", "85%", "15%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <ScanLine className="h-12 w-12 text-primary animate-pulse-glow" />
        <p className="text-sm text-muted-foreground text-center px-6">
          Point your camera at a QR code to scan and pay
        </p>
        <Button
          onClick={startScanner}
          className="bg-gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow-primary gap-2"
          disabled={isStartingCamera}
        >
          <Camera className="h-4 w-4" />
          {isStartingCamera ? "Opening..." : "Open Camera"}
        </Button>
      </motion.div>

      {isCameraOpen && <div id="upi-qr-reader" className="mx-auto max-w-[300px] mb-4" />}

      {!!scanMessage && (
        <div className="mb-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Manual Entry Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <button
          onClick={() => setShowManual(!showManual)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Keyboard className="h-4 w-4" />
          Or enter manually
        </button>
      </motion.div>

      {/* Manual Entry Form */}
      {showManual && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-6 space-y-4"
        >
          <div className="bg-gradient-card rounded-2xl p-5 border border-border space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Grocery shopping"
                className="bg-secondary border-border rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Amount</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                type="number"
                className="bg-secondary border-border rounded-xl text-xl font-display"
              />
            </div>
            <Button
              onClick={handlePay}
              disabled={!canPay}
              className="w-full bg-gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow-primary gap-2"
            >
              Pay <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ScanPage;
