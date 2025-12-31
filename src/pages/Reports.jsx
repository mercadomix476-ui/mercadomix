import React, { useState } from "react";
import {
  fetchSalesReport,
  fetchStockReport,
  fetchMovementsReport,
} from "../api/reportsService";

const Reports = () => {
  const [reportType, setReportType] = useState("sales");
  const [filters, setFilters] = useState({});
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (reportType === "sales") {
        data = await fetchSalesReport(filters);
      } else if (reportType === "stock") {
        data = await fetchStockReport(filters);
      } else if (reportType === "movements") {
        data = await fetchMovementsReport(filters);
      }
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>

      <div className="mb-4">
        <label className="block mb-2">Tipo de Relatório:</label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="border rounded p-2 w-full"
        >
          <option value="sales">Vendas</option>
          <option value="stock">Estoque</option>
          <option value="movements">Movimentações</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2">Filtros:</label>
        <input
          type="text"
          name="filter"
          placeholder="Ex: Data, Cliente, Produto"
          onChange={handleFilterChange}
          className="border rounded p-2 w-full"
        />
      </div>

      <button
        onClick={fetchReport}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Gerar Relatório
      </button>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-500">Erro: {error}</p>}

      <div className="mt-4">
        {reportData.length > 0 && (
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                {Object.keys(reportData[0]).map((key) => (
                  <th key={key} className="border border-gray-300 px-2 py-1">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, idx) => (
                    <td key={idx} className="border border-gray-300 px-2 py-1">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;