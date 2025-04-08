import StatCard from "./StatCard";
import { StatsContainer } from "../styles/GlobalStyles";

const StatCardsContainer = ({ stats }) => {
  return (
    <StatsContainer>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </StatsContainer>
  );
};

export default StatCardsContainer;
