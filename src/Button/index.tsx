interface IFodasse{
   children: string,
   value: string,
   row: string
   column: string
   onClick: Function
}

export default function Button({ children, value, row, column, onClick }: IFodasse){
   return (
      <button 
         onClick={() => onClick({ key: value})} 
         className="calculator__grid__button"
         style={{ gridRow: row, gridColumn: column}}
         data-value={value}>
            <div className="calculator__grid__button__text">{children}</div>
      </button>
   )
}