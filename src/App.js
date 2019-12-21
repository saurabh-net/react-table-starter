import React from 'react';
import logo from './logo.svg';
import './App.css';
import Select from 'react-select';


import styled from 'styled-components'
import { useTable, useFilters, useGlobalFilter, usePagination, useSortBy, useColumnOrder } from 'react-table'
// A great library for fuzzy filtering/sorting items
import matchSorter from 'match-sorter'
import 'bootstrap/dist/css/bootstrap.min.css';

import BTable from 'react-bootstrap/Table';

import makeData from './makeData'

const Styles = styled.div`
  padding: 1rem;
  table {
    border-spacing: 0;
    border: 1px solid black;
    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }
    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;
      :last-child {
        border-right: 0;
      }
    }
  }
`

// Define a default UI for filtering
function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) {
  const count = preGlobalFilteredRows.length

  return (
    <span>
      Search:{' '}
      <input
        value={globalFilter || ''}
        onChange={e => {
          setGlobalFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
        }}
        placeholder={`${count} records to search ...`}
        style={{
          fontSize: '1.1rem',
          border: '0',
        }}
      />
    </span>
  )
}

// Define a default UI for filtering
function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter },
}) {
  const count = preFilteredRows.length

  return (
    <input
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
      }}
      placeholder={`Search column...`}
    />
  )
}

// This is a custom filter UI for selecting
// a unique option from a list
function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}) {
  // Calculate the options for filtering
  // using the preFilteredRows
  const options = React.useMemo(() => {
    const optionsSet = new Set()
    preFilteredRows.forEach(row => {
      optionsSet.add(row.values[id])
    })
    const options = new Set()
    optionsSet.forEach(option => {
        options.add({value: option, label: option})
    })

    return [...options.values()]
  }, [id, preFilteredRows])

  // Render a multi-select box
  return (

    <Select isMulti
        value={filterValue}
        onChange={(values, actionMeta) => {
          setFilter(values || undefined)}}
        options={options}
      />



  )
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [row => row.values[id]] })
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = val => !val

// Our table component

export const includes = (rows, ids, filterValue) => {
  return rows.filter(row => {
    return ids.some(id => {
      const rowValue = row.values[id]
      return filterValue.includes(rowValue)
    })
  })
}

includes.autoRemove = val => !val || !val.length
function Table({ columns, data }) {
  const globalFilter = "fuzzyText"
  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true
        })
      },
      
      includes: (rows, ids, filterValue) => {
        const modFilterValue = []
        filterValue.forEach(value => modFilterValue.push(value.label))

        return rows.filter(row => {
          return ids.some(id => {
            const rowValue = row.values[id]
            return modFilterValue.includes(rowValue)
          })
        })
      }
    }),
    []
    )

    const defaultColumn = React.useMemo(
        () => ({
          // Let's set up our default Filter UI
          Filter: DefaultColumnFilter,
          filter: 'fuzzyText'
        }),
        []
      )

      const initialState = {
        // hiddenColumns: ['progress', 'visits'],
        // columnOrder: ['status'],
      }

      const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        state,
        flatColumns,
        preGlobalFilteredRows,
        setGlobalFilter,

        page, // Instead of using 'rows', we'll use page,
        // which has only the rows for the active page

        // The rest of these things are super handy, too ;)
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize }
      } = useTable(
        {
          columns,
          data,
          defaultColumn, // Be sure to pass the defaultColumn option
          filterTypes,
          initialState
        },
        useColumnOrder,
        useFilters, // useFilters!
        useGlobalFilter, // useGlobalFilter!
        useSortBy, 
        usePagination
      )
      
      console.log((flatColumns.map(d => d.id)))

      // We don't want to render all of the rows for this example, so cap
      // it for this use case
      // const pageSize = 30
      // const firstPageRows = rows.slice(0, pageSize)

      return (
          <>
              <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={state.globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            <br/>

          <div className="table-container">
            <BTable striped bordered hover header-fixed size="sm" {...getTableProps()}>
              <thead>
                {headerGroups.map(headerGroup => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map(column => (
                      <th {...column.getHeaderProps()}>
                        <div>
                        {/* Add a sort direction indicator */}
                        <span {...column.getSortByToggleProps()}>
                        {column.render('Header')}
                          {column.isSorted
                            ? column.isSortedDesc
                              ? ' 🔽'
                              : ' 🔼'
                            : ''}
                        </span>
                        </div>
                        {/* Render the columns filter UI */}
                        <div>{column.canFilter ? column.render('Filter') : null}</div>
                      </th>
                    ))}
                  </tr>
                ))}
                <tr>
          </tr>
              </thead>
              <tbody {...getTableBodyProps()}>
                {page.map((row, i) => {
                  prepareRow(row)
                  return (
                    <tr {...row.getRowProps()}>
                      {row.cells.map(cell => {
                        return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </BTable>
            </div>
            <br />
            {/*
            <div>Showing the first {pageSize} results of {rows.length} rows</div>
            <div>
              <pre>
                <code>{JSON.stringify(state.filters, null, 2)}</code>
              </pre>
            </div>
            <br />
            */}
            {/* 
        Pagination can be built however you'd like. 
        This is just a very basic UI implementation:
      */}
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
          </>
        )
      }



function App() {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        columns: [
          {
            Header: 'First Name',
            accessor: 'firstName',
            filter: undefined,
          },
          {
            Header: 'Last Name',
            accessor: 'lastName',
            disableFilters: true
          },
        ],
      },
      {
        Header: 'Info',
        columns: [
          {
            Header: 'Age',
            accessor: 'age',
          },
          {
            Header: 'Visits',
            accessor: 'visits',
          },
          {
            Header: 'Status',
            accessor: 'status',
            Filter: SelectColumnFilter,
            filter: 'includes',
          },
          {
            Header: 'Profile Progress',
            accessor: 'progress',
          },
        ],
      },
    ],
    []
  )

  const data = React.useMemo(() => makeData(1000), [])

  return (
    <Styles>
      <Table columns={columns} data={data} />
    </Styles>
  )
}

export default App