import {
  Table as ShadcnTable,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

const Table = ({ columns, data, onRowClick, emptyMessage = 'No hay datos', loading = false, className = '' }) => {
  if (loading) {
    return (
      <div className={`rounded-lg border bg-card ${className}`}>
        <div className="animate-pulse">
          <div className="h-12 bg-muted border-b"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 border-b border-border flex items-center px-4 gap-4">
              {columns?.map((_, idx) => (
                <div key={idx} className="h-4 bg-muted/30 rounded w-24"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={`rounded-lg border bg-card p-12 text-center ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-muted-foreground font-medium">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border bg-card overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <ShadcnTable>
          <TableHeader>
            <TableRow>
              {columns?.map((col, idx) => (
                <TableHead key={idx}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIdx) => (
              <TableRow
                key={rowIdx}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns?.map((col, colIdx) => (
                  <TableCell key={colIdx}>
                    {col.render ? col.render(row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </ShadcnTable>
      </div>
    </div>
  )
}

export { Table as default, Table }