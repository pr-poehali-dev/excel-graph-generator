import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataRow {
  [key: string]: string | number;
}

export default function Index() {
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [fileName, setFileName] = useState<string>('');

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const binaryStr = event.target?.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as DataRow[];

        if (jsonData.length > 0) {
          setData(jsonData);
          const cols = Object.keys(jsonData[0]);
          setColumns(cols);
          setXAxis(cols[0]);
          setYAxis(cols[1]);
          toast.success('Файл успешно загружен');
        }
      } catch (error) {
        toast.error('Ошибка при чтении файла');
      }
    };

    reader.readAsBinaryString(file);
  };

  const exportChart = () => {
    const chartElement = document.getElementById('data-chart');
    if (!chartElement) return;

    import('html2canvas').then((html2canvas) => {
      html2canvas.default(chartElement).then((canvas) => {
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = canvas.toDataURL();
        link.click();
        toast.success('График экспортирован');
      });
    });
  };

  const calculateStats = () => {
    if (!data.length || !yAxis) return null;

    const values = data.map((row) => Number(row[yAxis])).filter((v) => !isNaN(v));
    if (!values.length) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { sum, avg, max, min, count: values.length };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Визуализация данных
          </h1>
          <p className="text-muted-foreground text-lg">
            Загрузите Excel файл и создайте интерактивные графики
          </p>
        </div>

        <Card className="p-8 animate-scale-in">
          <div className="flex items-center gap-4 flex-wrap">
            <label htmlFor="file-upload" className="cursor-pointer">
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button className="gap-2">
                <Icon name="Upload" size={20} />
                Загрузить Excel
              </Button>
            </label>

            {fileName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
                <Icon name="FileSpreadsheet" size={16} />
                {fileName}
              </div>
            )}

            {data.length > 0 && (
              <Button onClick={exportChart} variant="outline" className="gap-2 ml-auto">
                <Icon name="Download" size={20} />
                Экспорт PNG
              </Button>
            )}
          </div>
        </Card>

        {data.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 animate-fade-in">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Icon name="Settings2" size={20} />
                    Настройки графика
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Тип графика</Label>
                      <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="line">
                            <div className="flex items-center gap-2">
                              <Icon name="LineChart" size={16} />
                              Линейный
                            </div>
                          </SelectItem>
                          <SelectItem value="bar">
                            <div className="flex items-center gap-2">
                              <Icon name="BarChart3" size={16} />
                              Столбчатый
                            </div>
                          </SelectItem>
                          <SelectItem value="pie">
                            <div className="flex items-center gap-2">
                              <Icon name="PieChart" size={16} />
                              Круговой
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ось X</Label>
                      <Select value={xAxis} onValueChange={setXAxis}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ось Y</Label>
                      <Select value={yAxis} onValueChange={setYAxis}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 animate-fade-in" id="data-chart">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Icon name="TrendingUp" size={20} />
                    График
                  </h3>

                  <ResponsiveContainer width="100%" height={400}>
                    {chartType === 'line' && (
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey={xAxis} stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={yAxis}
                          stroke="#2563EB"
                          strokeWidth={2}
                          dot={{ fill: '#2563EB', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    )}

                    {chartType === 'bar' && (
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey={xAxis} stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey={yAxis} fill="#2563EB" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    )}

                    {chartType === 'pie' && (
                      <PieChart>
                        <Pie
                          data={data}
                          dataKey={yAxis}
                          nameKey={xAxis}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          label
                        >
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {stats && (
                <Card className="p-6 animate-fade-in">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Icon name="Calculator" size={20} />
                    Статистика
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Количество</span>
                      <span className="font-semibold text-primary">{stats.count}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Среднее</span>
                      <span className="font-semibold text-secondary">{stats.avg.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Максимум</span>
                      <span className="font-semibold">{stats.max}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Минимум</span>
                      <span className="font-semibold">{stats.min}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Сумма</span>
                      <span className="font-semibold text-amber-600">{stats.sum.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-6 animate-fade-in">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Icon name="Table" size={20} />
                  Предпросмотр данных
                </h3>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white border-b">
                      <tr>
                        {columns.map((col) => (
                          <th key={col} className="text-left p-2 font-medium text-muted-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-slate-50">
                          {columns.map((col) => (
                            <td key={col} className="p-2">
                              {row[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      Показано 10 из {data.length} строк
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {data.length === 0 && (
          <Card className="p-12 text-center animate-fade-in">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Icon name="FileSpreadsheet" size={32} className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Загрузите Excel файл</h3>
              <p className="text-muted-foreground">
                Выберите файл .xlsx или .csv для начала работы с визуализацией данных
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
