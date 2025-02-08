-- Function to update achievement stats (percentiles and ranks)
create or replace function update_achievement_stats()
returns void
language plpgsql
security definer
as $$
declare
    achievement record;
    total_players integer;
    rank_counter integer;
begin
    -- Get total number of players
    select count(distinct user_id) into total_players from user_achievements;

    -- Process each achievement
    for achievement in (select distinct achievement_id from achievement_stats)
    loop
        -- Reset rank counter
        rank_counter := 1;

        -- Update ranks and percentiles
        with ranked_stats as (
            select 
                id,
                time_to_unlock,
                row_number() over (order by time_to_unlock) as rank
            from achievement_stats
            where achievement_id = achievement.achievement_id
        )
        update achievement_stats as s
        set 
            global_rank = r.rank,
            percentile = (r.rank::float / total_players * 100)
        from ranked_stats r
        where s.id = r.id;

    end loop;
end;
$$;

-- Create a cron job to run every hour
select cron.schedule(
    'update-achievement-stats',
    '0 * * * *', -- Every hour
    $$
    select update_achievement_stats();
    $$
);
