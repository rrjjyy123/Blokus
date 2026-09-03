interface Props {
  onClose: () => void
}

/** 4×4 미니 보드로 규칙 예시를 그린다 */
function MiniBoard({ cells }: { cells: Record<string, 'blue' | 'ghost'> }) {
  return (
    <div className="mini-board">
      {Array.from({ length: 16 }, (_, i) => {
        const key = `${Math.floor(i / 4)},${i % 4}`
        const kind = cells[key]
        if (kind === 'blue') return <div key={i} className="sq c-blue" />
        if (kind === 'ghost') return <div key={i} className="sq c-blue" style={{ opacity: 0.45 }} />
        return <div key={i} />
      })}
    </div>
  )
}

export function RulesModal({ onClose }: Props) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>블로커스 규칙</h2>
        <p>
          20×20 보드에 자기 색 조각 21개를 최대한 많이 놓는 게임입니다. 조각은 1칸짜리부터 5칸짜리까지
          모두 모양이 다르고, 색마다 총 89칸을 가집니다.
        </p>

        <h3>1. 첫 조각</h3>
        <p>자기 색 코너 칸(보드에 옅게 표시된 점)을 반드시 덮어야 합니다.</p>

        <h3>2. 두 번째 조각부터</h3>
        <div className="rule-example">
          <div>
            <MiniBoard cells={{ '1,1': 'blue', '2,2': 'ghost' }} />
            <div className="rule-caption ok">○ 꼭짓점이 닿음</div>
          </div>
          <div>
            <MiniBoard cells={{ '1,1': 'blue', '1,2': 'ghost' }} />
            <div className="rule-caption bad">✕ 변이 닿음</div>
          </div>
          <div>
            <MiniBoard cells={{ '1,1': 'blue', '3,3': 'ghost' }} />
            <div className="rule-caption bad">✕ 아무 데도 안 닿음</div>
          </div>
        </div>
        <ul>
          <li>같은 색 조각과 <strong>꼭짓점으로 최소 한 번</strong> 닿아야 합니다.</li>
          <li>같은 색 조각과 <strong>변이 닿으면 안 됩니다.</strong></li>
          <li>다른 색과는 어떻게 닿아도 상관없습니다.</li>
          <li>조각은 자유롭게 돌리고 뒤집을 수 있습니다.</li>
        </ul>

        <h3>3. 차례와 종료</h3>
        <ul>
          <li>놓을 수 있는 자리가 하나도 없는 색은 자동으로 차례를 넘기고 그대로 탈락합니다.</li>
          <li>모두가 더 놓을 수 없게 되면 게임이 끝납니다.</li>
        </ul>

        <h3>4. 점수</h3>
        <ul>
          <li>손에 남은 조각의 <strong>칸 수만큼 −1점</strong>입니다. (다 남기면 −89점)</li>
          <li>21개를 전부 놓으면 <strong>+15점</strong>.</li>
          <li>그 마지막 조각이 1칸짜리였다면 <strong>+5점</strong>을 더 받습니다.</li>
          <li>점수가 가장 높은 사람이 이깁니다.</li>
        </ul>

        <h3>5. 인원별 규칙</h3>
        <ul>
          <li><strong>4인</strong> — 각자 한 색씩 맡습니다.</li>
          <li><strong>3인</strong> — 파랑·노랑·빨강 세 색만 쓰고 초록은 사용하지 않습니다.</li>
          <li><strong>2인</strong> — 한 사람이 대각선 두 색을 맡고, 두 색의 점수를 합산합니다.</li>
        </ul>

        <div className="modal-actions">
          <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
