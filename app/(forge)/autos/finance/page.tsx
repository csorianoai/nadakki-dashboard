"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calculator, ArrowRightLeft, Table } from "lucide-react";
import { motion } from "@/lib/motion-stub";
import {
  useCalculatePayment,
  useCalculateMaxPrice,
  useAmortization,
} from "@/lib/autos-portal/hooks";

type CalcMode = "forward" | "inverse";

function formatRD(value: number): string {
  return `RD$ ${value.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function FinanceCalculatorPage() {
  const searchParams = useSearchParams();
  const priceFromUrl = searchParams.get("price");

  const [mode, setMode] = useState<CalcMode>("forward");

  // Forward fields
  const [vehiclePrice, setVehiclePrice] = useState(priceFromUrl ?? "");
  const [downPayment, setDownPayment] = useState("");
  const [annualRate, setAnnualRate] = useState("12");
  const [termMonths, setTermMonths] = useState("48");

  // Inverse fields
  const [monthlyBudget, setMonthlyBudget] = useState("");

  const [showAmortization, setShowAmortization] = useState(false);

  const forwardCalc = useCalculatePayment();
  const inverseCalc = useCalculateMaxPrice();
  const amortCalc = useAmortization();

  function handleForwardCalc(e: React.FormEvent) {
    e.preventDefault();
    forwardCalc.mutate({
      vehicle_price: Number(vehiclePrice),
      down_payment: Number(downPayment),
      annual_rate_pct: Number(annualRate),
      term_months: Number(termMonths),
    });
    setShowAmortization(false);
  }

  function handleInverseCalc(e: React.FormEvent) {
    e.preventDefault();
    inverseCalc.mutate({
      monthly_budget: Number(monthlyBudget),
      down_payment: Number(downPayment),
      annual_rate_pct: Number(annualRate),
      term_months: Number(termMonths),
    });
  }

  function handleAmortization() {
    amortCalc.mutate({
      vehicle_price: Number(vehiclePrice),
      down_payment: Number(downPayment),
      annual_rate_pct: Number(annualRate),
      term_months: Number(termMonths),
    });
    setShowAmortization(true);
  }

  return (
    <div className="ndk-page ndk-fade-in p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <Calculator className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Calculadora de Financiamiento
            </h1>
            <p className="text-gray-400">
              Calcula tu cuota mensual o el precio máximo que puedes financiar
            </p>
          </div>
        </div>
      </motion.div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("forward")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === "forward"
              ? "bg-purple-600 text-white"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          <Calculator className="w-4 h-4" />
          Precio → Cuota
        </button>
        <button
          onClick={() => setMode("inverse")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === "inverse"
              ? "bg-purple-600 text-white"
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Presupuesto → Precio máx
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl"
        >
          <form
            onSubmit={mode === "forward" ? handleForwardCalc : handleInverseCalc}
            className="space-y-4"
          >
            {mode === "forward" ? (
              <InputField
                label="Precio del vehículo (RD$)"
                value={vehiclePrice}
                onChange={setVehiclePrice}
                placeholder="800,000"
              />
            ) : (
              <InputField
                label="Presupuesto mensual (RD$)"
                value={monthlyBudget}
                onChange={setMonthlyBudget}
                placeholder="15,000"
              />
            )}

            <InputField
              label="Inicial (RD$)"
              value={downPayment}
              onChange={setDownPayment}
              placeholder="200,000"
            />

            <InputField
              label="Tasa anual (%)"
              value={annualRate}
              onChange={setAnnualRate}
              placeholder="12"
            />

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Plazo (meses)
              </label>
              <select
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:border-purple-500/50 focus:outline-none"
              >
                {[12, 24, 36, 48, 60, 72, 84].map((m) => (
                  <option key={m} value={m}>
                    {m} meses ({Math.round(m / 12)} año
                    {m >= 24 ? "s" : ""})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={
                mode === "forward"
                  ? forwardCalc.isPending
                  : inverseCalc.isPending
              }
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {(mode === "forward"
                ? forwardCalc.isPending
                : inverseCalc.isPending)
                ? "Calculando..."
                : "Calcular"}
            </button>
          </form>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Forward result */}
          {mode === "forward" && forwardCalc.data && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <h3 className="text-sm text-gray-400 mb-1">Cuota mensual</h3>
              <p className="text-4xl font-bold text-white mb-4">
                {formatRD(forwardCalc.data.monthly_payment)}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <ResultItem
                  label="Capital"
                  value={formatRD(forwardCalc.data.principal)}
                />
                <ResultItem
                  label="Interés total"
                  value={formatRD(forwardCalc.data.total_interest)}
                />
                <ResultItem
                  label="Costo total"
                  value={formatRD(forwardCalc.data.total_cost)}
                />
                <ResultItem
                  label="Inicial"
                  value={formatRD(forwardCalc.data.down_payment)}
                />
              </div>

              <button
                onClick={handleAmortization}
                disabled={amortCalc.isPending}
                className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-white/20 transition-all"
              >
                <Table className="w-4 h-4" />
                {amortCalc.isPending
                  ? "Generando..."
                  : "Ver tabla de amortización"}
              </button>
            </div>
          )}

          {/* Inverse result */}
          {mode === "inverse" && inverseCalc.data && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <h3 className="text-sm text-gray-400 mb-1">
                Precio máximo del vehículo
              </h3>
              <p className="text-4xl font-bold text-white mb-4">
                {formatRD(inverseCalc.data.max_vehicle_price)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ResultItem
                  label="Presupuesto mensual"
                  value={formatRD(inverseCalc.data.monthly_budget)}
                />
                <ResultItem
                  label="Inicial"
                  value={formatRD(inverseCalc.data.down_payment)}
                />
                <ResultItem
                  label="Tasa anual"
                  value={`${inverseCalc.data.annual_rate_pct}%`}
                />
                <ResultItem
                  label="Plazo"
                  value={`${inverseCalc.data.term_months} meses`}
                />
              </div>
            </div>
          )}

          {/* Error states */}
          {forwardCalc.isError && (
            <p className="text-red-400 text-sm">
              Error en el cálculo. Verifique los valores.
            </p>
          )}
          {inverseCalc.isError && (
            <p className="text-red-400 text-sm">
              Error en el cálculo. Verifique los valores.
            </p>
          )}
        </motion.div>
      </div>

      {/* Amortization table */}
      {showAmortization && amortCalc.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Tabla de Amortización
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="pb-2 text-gray-400 font-medium">#</th>
                  <th className="pb-2 text-gray-400 font-medium">Cuota</th>
                  <th className="pb-2 text-gray-400 font-medium">Capital</th>
                  <th className="pb-2 text-gray-400 font-medium">Interés</th>
                  <th className="pb-2 text-gray-400 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {amortCalc.data.periods.map((p) => (
                  <tr
                    key={p.period}
                    className="border-b border-white/5 text-gray-300"
                  >
                    <td className="py-2">{p.period}</td>
                    <td className="py-2">{formatRD(p.payment)}</td>
                    <td className="py-2">
                      {formatRD(p.principal_portion)}
                    </td>
                    <td className="py-2">
                      {formatRD(p.interest_portion)}
                    </td>
                    <td className="py-2">
                      {formatRD(p.remaining_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/20 text-white font-medium">
                  <td className="pt-3">Total</td>
                  <td className="pt-3">
                    {formatRD(amortCalc.data.total_payments)}
                  </td>
                  <td className="pt-3">
                    {formatRD(amortCalc.data.total_principal)}
                  </td>
                  <td className="pt-3">
                    {formatRD(amortCalc.data.total_interest)}
                  </td>
                  <td className="pt-3">RD$ 0.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
      />
    </div>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-white/5">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
