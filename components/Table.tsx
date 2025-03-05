export default function Table({ title, data, columns }) {
    return (
        <div className="w-full">
            <h2 className="text-xl font-bold mb-2">{title}:</h2>
            <table className="w-full border-collapse text-left">
                <thead>
                <tr className="bg-gray-500">
                    {columns.map(col => (
                        <th key={col.key} className="border p-2">{col.label}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {data.map(row => (
                    <tr key={row.id} className="border-b">
                        {columns.map(col => (
                            <td key={col.key} className="border p-2">
                                {col.render ? col.render(row) : row[col.key]}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}