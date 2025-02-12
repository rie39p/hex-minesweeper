import React, {useCallback, useState} from 'react'
import {Board} from './Board'
import {evenColOffsets, GameState, oddColOffsets} from '../utils/constants'

export type Cell = {
  x: number
  y: number
  row: number
  col: number
  isFlag: boolean
  isBomb: boolean
  isRevealed: boolean
  value: number
}

type ManageBoardProps = {
  rows: number
  columns: number
  hexSize: number // 六角形の1辺の長さ
}
export const ManageBoard: React.FC<ManageBoardProps> = ({rows, columns, hexSize}) => {
  const [gameState, setGameState] = useState<GameState>(GameState.Playing)
  const hexWidth = hexSize * 2
  const hexHeight = Math.sqrt(3) * hexSize
  const horizontalStep = hexWidth * 0.75
  const verticalStep = hexHeight

  // SVGの描画範囲を計算
  const svgWidth = columns * horizontalStep + hexSize * 2
  const svgHeight = rows * verticalStep + hexHeight / 2 + hexSize

  // 周りの爆弾の数を計算する関数
  const countBombs = (board: Cell[][]): Cell[][] => {
    const newBoard = board.map((rowCells, row) =>
      rowCells.map((cell, col) => {
        let count = 0
        // 偶数列と奇数列で隣接セルのオフセットが異なる
        const offsets = col % 2 === 0 ? evenColOffsets : oddColOffsets
        for (const [dy, dx] of offsets) {
          const newRow = row + dy
          const newCol = col + dx

          // 隣接セルが範囲内か確認
          if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board[0].length) {
            if (board[newRow][newCol].isBomb) {
              count++
            }
          }
        }
        return {
          ...cell,
          value: count,
        }
      }),
    )
    return newBoard
  }

  const createBoard = useCallback((): Cell[][] => {
    const board: Cell[][] = []
    for (let row = 0; row < rows; row++) {
      const rowCells: Cell[] = []
      for (let col = 0; col < columns; col++) {
        const x = col * horizontalStep + hexSize
        const y = row * verticalStep + (col % 2 === 0 ? 0 : hexHeight / 2) + hexSize
        rowCells.push({
          x,
          y,
          row,
          col,
          isFlag: false,
          isBomb: false,
          isRevealed: false,
          value: 0,
        })
      }
      board.push(rowCells)
    }
    return board
  }, [rows, columns, horizontalStep, verticalStep, hexSize, hexHeight])

  const [board, setBoard] = useState<Cell[][]>(createBoard)

  const handleRestart = useCallback(() => {
    setBoard(createBoard)
    setGameState(GameState.Playing)
  }, [createBoard])

  const installBombs = useCallback(
    (y: number, x: number): Cell[][] => {
      const totalCells = rows * columns
      // 爆弾が設置される割合を指定できるよ
      const totalBombs = Math.floor(totalCells * 0.15)
      const bombPositions = new Set<string>()

      // クリックされたセルとその周囲を避ける
      const excludePositions = new Set<string>()
      const offsets = y % 2 === 0 ? evenColOffsets : oddColOffsets

      // クリックされたセルを除外リストに追加
      excludePositions.add(`${y},${x}`)

      // クリックされたセルの隣接セルを除外リストに追加
      for (const [dy, dx] of offsets) {
        const newRow = y + dy
        const newCol = x + dx
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < columns) {
          excludePositions.add(`${newRow},${newCol}`)
        }
      }

      // 爆弾の配置
      while (bombPositions.size < totalBombs) {
        const randomRow = Math.floor(Math.random() * rows)
        const randomCol = Math.floor(Math.random() * columns)
        const position = `${randomRow},${randomCol}`

        // 除外リストに含まれていない場合のみ爆弾を配置
        if (!excludePositions.has(position)) {
          bombPositions.add(position)
        }
      }

      // ボードに爆弾を設定
      const newBoard = board.map((rowCells, row) =>
        rowCells.map((cell, col) => {
          const position = `${row},${col}`
          return {
            ...cell,
            isBomb: bombPositions.has(position),
          }
        }),
      )
      return countBombs(newBoard)
    },
    [board, rows, columns],
  )

  return (
    <div>
      {gameState === GameState.GameOver && (
        <div>
          <h2>Game Over</h2>
          <button onClick={handleRestart}>Restart</button>
        </div>
      )}
      {gameState === GameState.GameClear && (
        <div>
          <h2>Game Clear</h2>
          <button onClick={handleRestart}>Restart</button>
        </div>
      )}
      <Board
        key={JSON.stringify(board)}
        cells={board}
        setCells={setBoard}
        hexSize={hexSize}
        svgWidth={svgWidth}
        svgHeight={svgHeight}
        gameState={gameState}
        installBombs={installBombs}
        onGameClear={() => setGameState(GameState.GameClear)}
        onGameOver={() => setGameState(GameState.GameOver)}
      />
    </div>
  )
}
