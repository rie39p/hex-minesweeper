import React, {useCallback, useState} from 'react'
import {HexCell} from './HexCell'
import {Cell} from './ManageBoard'
import {evenColOffsets, oddColOffsets} from '../utils/constants'

type Board = {
  cells: Cell[][]
  hexSize: number
  svgWidth: number
  svgHeight: number
  onGameClear: () => void
  onGameOver: () => void
}

export const Board: React.FC<Board> = ({cells, hexSize, svgWidth, svgHeight, onGameClear, onGameOver}) => {
  const [board, setBoard] = useState<Cell[][]>(cells)

  const revealAdjacentCells = useCallback((row: number, col: number, prevBoard: Cell[][]): Cell[][] => {
    const offsets = col % 2 === 0 ? evenColOffsets : oddColOffsets
    const newBoard = [...prevBoard]

    const dfs = (currentRow: number, currentCol: number) => {
      const cell = newBoard[currentRow][currentCol]
      if (cell.isRevealed || cell.isFlag || cell.isBomb) return

      // 現在のセルを開く
      newBoard[currentRow] = [...newBoard[currentRow]]
      newBoard[currentRow][currentCol] = {...cell, isRevealed: true}

      // value が 0 の場合、隣接セルを再帰的に開く
      if (cell.value === 0) {
        for (const [dy, dx] of offsets) {
          const newRow = currentRow + dy
          const newCol = currentCol + dx

          // 隣接セルが範囲内であれば再帰的に探索
          if (newRow >= 0 && newRow < newBoard.length && newCol >= 0 && newCol < newBoard[0].length) {
            dfs(newRow, newCol)
          }
        }
      }
    }

    dfs(row, col)
    return newBoard
  }, [])

  // 左クリックイベント
  const onLeftClick = useCallback(
    (row: number, col: number) => {
      setBoard((prevBoard) => {
        const cell = prevBoard[row][col]
        if (cell.isFlag || cell.isRevealed) return prevBoard

        // セルを開く
        let newBoard = [...prevBoard]
        if (cell.isBomb) {
          onGameOver()
        } else if (cell.value === 0) {
          // 隣接セルを再帰的に開く
          newBoard = revealAdjacentCells(row, col, prevBoard)
        } else {
          // 通常セルを開く
          newBoard[row] = [...prevBoard[row]]
          newBoard[row][col] = {...cell, isRevealed: true}
        }
        return newBoard
      })
    },
    [onGameOver, revealAdjacentCells],
  )

  // 右クリックイベント（旗の切り替え）
  const onRightClick = useCallback((row: number, col: number) => {
    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((rowCells, rIdx) => {
        return rowCells.map((cell, cIdx) => {
          if (rIdx === row && cIdx === col) {
            return {...cell, isFlag: !cell.isFlag}
          }
          return cell
        })
      })
      return newBoard
    })
  }, [])

  React.useEffect(() => {
    // 爆弾以外のセルが全て開かれたかどうかを判定
    const isAllRevealed = board.every((rowCells) => rowCells.every((cell) => cell.isRevealed || cell.isBomb))
    if (isAllRevealed) {
      onGameClear()
    }
  }, [board, onGameClear])

  return (
    <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
      {board.map((rowCells) =>
        rowCells.map((cell) => (
          <React.Fragment key={`${cell.row}-${cell.col}`}>
            <HexCell
              cell={cell}
              size={hexSize}
              onLeftClick={() => onLeftClick(cell.row, cell.col)}
              onRightClick={() => onRightClick(cell.row, cell.col)}
              stroke="black"
            />
          </React.Fragment>
        )),
      )}
    </svg>
  )
}
