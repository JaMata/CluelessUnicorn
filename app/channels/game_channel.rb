class GameChannel < ApplicationCable::Channel
  def subscribed
    stream_from "player_#{uuid}"
    Match.create(uuid)
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    Game.withdraw(uuid)
    Match.remove(uuid)
  end

  def take_turn(data)
  	Game.take_turn(uuid, data)
  end

  def new_game()
  	Game.new_game(uuid)
  end
end
