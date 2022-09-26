export default function Visor({ total, calculation }: { total: string, calculation: string }){
   return (
      <div className="calculator__visor">
         <div className="calculator__visor__inner">
            <p className="calculator__visor__inner__total">{total}</p>
            <p className="calculator__visor__inner__calculation">{calculation}</p>
         </div>
      </div>
   )
}