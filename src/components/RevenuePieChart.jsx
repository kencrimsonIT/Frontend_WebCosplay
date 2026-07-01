import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import '../styles/RevenuePieChart.css'

function RevenuePieChart({ data, loading }) {
    if (loading) {
        return <div className="revenue-chart-loading">Đang tải biểu đồ...</div>
    }

    if (!data?.slices?.length) {
        return <div className="revenue-chart-empty">Chưa có dữ liệu doanh thu trong tháng này.</div>
    }

    const chartData = data.slices.map((s) => ({
        name: s.categoryName,
        value: Number(s.revenue),
        percentage: s.percentage,
        color: s.color,
    }))

    return (
        <div className="revenue-pie-wrap">
            <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={50}
                        paddingAngle={2}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                    >
                        {chartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => [`${Number(value).toLocaleString('vi-VN')}đ`, 'Doanh thu']}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>

            <div className="revenue-pie-legend">
                {chartData.map((item) => (
                    <div key={item.name} className="revenue-legend-row">
                        <span className="legend-dot" style={{ background: item.color }} />
                        <span>{item.name}</span>
                        <strong>{item.value.toLocaleString('vi-VN')}đ</strong>
                        <span className="legend-pct">{item.percentage}%</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default RevenuePieChart
